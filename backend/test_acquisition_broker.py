"""Broker boundaries and optional real PostgreSQL transition verification.

Set ACQUISITION_PGLITE_ROOT to an installed @electric-sql/pglite package directory
for the database test. This is not an additional production dependency.
"""
import base64
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from types import SimpleNamespace
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from PIL import Image
from acquisition_broker import AcquisitionBroker, decode_payload, digest, verify_requested_source
from acquisition_routes import create_acquisition_router
from authentication import AuthenticatedUser
from test_anyror_vf7_reader import fixture

OWNER='00000000-0000-0000-0000-000000000001'
WORKER='10000000-0000-0000-0000-000000000001'
JOB='20000000-0000-0000-0000-000000000001'
TOKEN='T'*43
LEASE='L'*43
REQUEST=dict(record_type='VF7',district='નમૂના જિલ્લો',taluka='નમૂના તાલુકો',village='નમૂના ગામ - 039',survey_no='3')

class Database:
    def __init__(self):self.calls=[];self.replies={}
    def rpc(self,name,body):
        self.calls.append((name,body));reply=self.replies.get(body['action'],{})
        if isinstance(reply,Exception):raise reply
        return SimpleNamespace(execute=lambda:SimpleNamespace(data=reply))

def encoded_image():
    out=io.BytesIO();Image.new('RGB',(100,30),'white').save(out,format='PNG')
    return base64.b64encode(out.getvalue()).decode()

class BrokerTests(unittest.TestCase):
    def setUp(self):self.sb=Database();self.broker=AcquisitionBroker(self.sb)
    def test_registration_stores_hash_only_and_returns_secret_once(self):
        row=self.broker.register();args=self.sb.calls[0][1]['args']
        self.assertNotIn('worker_token',args);self.assertNotIn('pairing_code',args)
        self.assertEqual(args['token_hash'],digest(row['worker_token']))
        self.assertEqual(args['pairing_hash'],digest(row['pairing_code']))
        self.assertGreaterEqual(len(row['worker_token']),43);self.assertRegex(row['pairing_code'],r'^[A-Z2-7]{12}$')
    def test_missing_storage_fails_closed(self):
        with self.assertRaises(HTTPException) as exc:AcquisitionBroker(None).register()
        self.assertEqual(exc.exception.status_code,503)
    def test_provider_error_does_not_leak_credential(self):
        self.sb.replies['poll']=RuntimeError('secret provider token')
        with self.assertRaises(HTTPException) as exc:self.broker.worker('poll',WORKER,TOKEN)
        self.assertEqual(exc.exception.status_code,503);self.assertNotIn('secret',exc.exception.detail)
    def test_invalid_worker_tokens_never_reach_database(self):
        for token in (None,'','short','T'*129):
            with self.assertRaises(HTTPException) as exc:self.broker.worker('poll',WORKER,token)
            self.assertEqual(exc.exception.status_code,401)
        self.assertEqual(self.sb.calls,[])
    def test_worker_hash_and_lease_denial(self):
        self.sb.replies['control']={'error':'Invalid retrieval lease.','status':403}
        with self.assertRaises(HTTPException) as exc:self.broker.worker('control',WORKER,TOKEN,job_id=JOB,lease_token=LEASE)
        self.assertEqual(exc.exception.status_code,403)
        args=self.sb.calls[0][1]['args'];self.assertEqual(args['token_hash'],digest(TOKEN));self.assertNotIn(TOKEN,json.dumps(args))
    def test_source_identity_exact_parcel_and_optional_village_code(self):
        self.assertEqual(verify_requested_source(fixture(),REQUEST)['survey_no'],'૩')
        for field,value in [('district','wrong'),('taluka','wrong'),('village','wrong'),('survey_no','4')]:
            with self.subTest(field=field),self.assertRaises(HTTPException) as exc:verify_requested_source(fixture(),dict(REQUEST,**{field:value}))
            self.assertEqual(exc.exception.status_code,422)
    def test_existing_aliases_only_no_similar_locality(self):
        source=fixture().replace('નમૂના જિલ્લો'.encode(),'ગાંધીનગર'.encode()).replace('નમૂના તાલુકો'.encode(),'કલોલ'.encode())
        self.assertTrue(verify_requested_source(source,dict(REQUEST,district='Gandhinagar',taluka='Kalol')))
        with self.assertRaises(HTTPException):verify_requested_source(source,dict(REQUEST,district='Gandhinagar',taluka='Kalol City'))
    def test_invalid_source_cannot_complete(self):
        self.sb.replies['original']={'request':REQUEST}
        for source in (b'<html>Custom Error</html>',fixture().replace('નમૂના ગામ'.encode(),'બીજું ગામ'.encode())):
            self.sb.calls.clear()
            with self.assertRaises(HTTPException):self.broker.complete(WORKER,TOKEN,JOB,LEASE,base64.b64encode(source).decode())
            self.assertEqual([c[1]['action'] for c in self.sb.calls],['original'])
    def test_server_rebuild_preserves_source_and_unreviewed_status(self):
        self.sb.replies['original']={'request':REQUEST};self.sb.replies['complete']={'status':'completed'};source=fixture()
        self.assertEqual(self.broker.complete(WORKER,TOKEN,JOB,LEASE,base64.b64encode(source).decode()),{'status':'completed'})
        args=self.sb.calls[-1][1]['args'];draft=args['result']
        self.assertFalse(draft['metadata']['user_review_confirmed']);self.assertFalse(draft['report']['coverage']['chain_complete'])
        self.assertFalse(draft['acquisition']['certified_copy']);self.assertTrue(draft['acquisition']['parcel_identity_matched'])
        self.assertEqual(draft['acquisition']['source_url'],'https://anyror.gujarat.gov.in/Information_pages/Info712Details.aspx')
        self.assertEqual(len(draft['report']['source_document']['sha256']),64)
        self.assertEqual(base64.b64decode(args['source_base64']),source)
        self.assertEqual(args['source_as_of'],'તા.06/04/2024 02:06:42 ની સ્થિતિએ')
    def test_raster_base64_and_size_limits(self):
        self.assertTrue(decode_payload(encoded_image(),131072,image=True))
        for value,image in [('!!!',False),(base64.b64encode(b'<svg/>').decode(),True),(base64.b64encode(b'\x89PNG\r\n\x1a\nfake').decode(),True),('',False)]:
            with self.assertRaises(HTTPException):decode_payload(value,131072,image=image)
        with self.assertRaises(HTTPException) as exc:decode_payload('A'*174768,131072)
        self.assertEqual(exc.exception.status_code,413)

class RoutesTests(unittest.TestCase):
    def setUp(self):
        self.sb=Database();self.rates=[]
        def identity(header):
            if header!='Bearer verified':raise HTTPException(401,'Sign in')
            return AuthenticatedUser(OWNER,'owner@example.test')
        app=FastAPI();app.include_router(create_acquisition_router(lambda:self.sb,identity,lambda request,bucket,**kwargs:self.rates.append((bucket,kwargs))))
        self.client=TestClient(app);self.auth={'Authorization':'Bearer verified'};self.wh={'X-Acquisition-Worker-Token':TOKEN}
    def test_account_routes_require_verified_owner(self):
        for method,path,body in [('get','/workers',None),('post','/workers/connect',{'pairing_code':'A'*12}),('post','/jobs',dict(REQUEST,worker_id=WORKER)),('get','/jobs/'+JOB,None),('get','/jobs/'+JOB+'/source',None),('post','/workers/'+WORKER+'/disconnect',None)]:
            response=getattr(self.client,method)('/acquisition'+path,**({'json':body} if body else {}))
            self.assertEqual(response.status_code,401,path)
        self.assertEqual(self.sb.calls,[])
    def test_owner_is_verified_not_client_supplied(self):
        response=self.client.post('/acquisition/jobs',headers=self.auth,json=dict(REQUEST,worker_id=WORKER))
        self.assertEqual(response.status_code,200);args=self.sb.calls[-1][1]['args'];self.assertEqual(args['owner_id'],OWNER);self.assertEqual(args['request'],REQUEST)
        self.assertEqual(self.client.post('/acquisition/jobs',headers=self.auth,json=dict(REQUEST,worker_id=WORKER,owner_id=OWNER)).status_code,422)
    def test_public_registration_rate_limit_and_no_cache(self):
        self.sb.replies['register']={'expires_at':'test'}
        response=self.client.post('/acquisition/workers/register');self.assertEqual(response.status_code,200)
        self.assertEqual(response.headers['cache-control'],'no-store');self.assertEqual(self.rates[-1],('acquisition-register',{'limit':3}))
        response=self.client.post('/acquisition/workers/'+WORKER+'/poll',headers=self.wh);self.assertEqual(response.status_code,200)
        self.assertEqual(len(self.sb.calls[-1][1]['args']['lease_token']),43)
    def test_vf7_only_bounded_fields(self):
        for changes in ({'record_type':'VF8A'},{'district':'a'*161},{'survey_no':'3\n4'},{'worker_id':'invalid'}):
            body=dict(REQUEST,worker_id=WORKER);body.update(changes)
            self.assertEqual(self.client.post('/acquisition/jobs',headers=self.auth,json=body).status_code,422)
    def test_answers_alnum_only_and_lease_bounded(self):
        for answer in ('<script>','A'*13,''):
            self.assertEqual(self.client.post('/acquisition/jobs/'+JOB+'/answer',headers=self.auth,json={'challenge_id':JOB,'answer':answer}).status_code,422)
        self.assertEqual(self.client.post('/acquisition/jobs/'+JOB+'/control',headers=self.wh,json={'worker_id':WORKER,'lease_token':'short'}).status_code,422)
    def test_source_private_attachment_sandbox(self):
        self.sb.replies['source']={'source_base64':base64.b64encode(fixture()).decode()}
        response=self.client.get('/acquisition/jobs/'+JOB+'/source',headers=self.auth)
        self.assertEqual(response.status_code,200);self.assertEqual(response.content,fixture())
        self.assertIn('attachment',response.headers['content-disposition']);self.assertIn("sandbox; default-src 'none'",response.headers['content-security-policy']);self.assertEqual(response.headers['cache-control'],'no-store')
    def test_failure_codes_cannot_contain_exception_or_portal_text(self):
        response=self.client.post('/acquisition/jobs/'+JOB+'/fail',headers=self.wh,json={'worker_id':WORKER,'lease_token':LEASE,'message':'secret provider exception'})
        self.assertEqual(response.status_code,422)

# Actual PostgreSQL, not a Python imitation of the production transitions.
SQL_TEST_JS=r'''const fs = require('fs');
const assert = require('assert').strict;
const {PGlite} = require('/tmp/satyalekh-acq-pg/node_modules/@electric-sql/pglite');
(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');`);
 await db.exec(fs.readFileSync(process.argv[2],'utf8'));
 async function call(action,args){return (await db.query('select public.acquisition_action($1,$2::jsonb) as value',[action,JSON.stringify(args)])).rows[0].value;}
 const owner='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
 const worker='10000000-0000-0000-0000-000000000001',token='a'.repeat(64),lease='B'.repeat(43);
 const wa={worker_id:worker,token_hash:token};
 let checks=0;function eq(a,b){checks++;assert.deepEqual(a,b);}
 await call('register',{...wa,pairing_hash:'PAIRHASH'});
 eq((await call('poll',wa)).connected,false);
 eq((await call('connect',{owner_id:owner,pairing_hash:'WRONG'})).status,409);
 eq((await call('connect',{owner_id:owner,pairing_hash:'PAIRHASH'})).connected,true);
 eq((await call('connect',{owner_id:other,pairing_hash:'PAIRHASH'})).status,409);
 eq((await call('workers',{owner_id:other})).workers.length,0);
 eq((await call('workers',{owner_id:owner})).workers[0].online,true);
 eq((await call('poll',{...wa,token_hash:'wrong'})).status,401);
 eq((await call('create',{worker_id:worker,owner_id:other,request:{}})).status,404);
 const request={record_type:'VF7',district:'district',taluka:'taluka',village:'village',survey_no:'3'};
 const job=await call('create',{worker_id:worker,owner_id:owner,request});
 eq(job.status,'queued');
 eq((await call('create',{worker_id:worker,owner_id:owner,request})).status,409);
 const claimed=await call('poll',{...wa,lease_token:lease});eq(claimed.job.id,job.id);eq(claimed.job.request,request);
 eq((await call('poll',{...wa,lease_token:'X'.repeat(43)})).job,undefined);
 const ja={...wa,job_id:job.id,lease_token:lease};
 eq((await call('read',{job_id:job.id,owner_id:other})).status,404);
 eq((await call('original',{...ja,lease_token:'wrong'})).status,403);
 eq((await call('original',ja)).request,request);
 eq((await call('complete',{...ja,result:{bad:true}})).status,409);
 const challenge=await call('challenge',{...ja,image_base64:'image'});
 eq(typeof challenge.challenge_id,'string');
 eq((await call('challenge',{...ja,image_base64:'image'})).status,409);
 eq((await call('answer',{job_id:job.id,owner_id:other,challenge_id:challenge.challenge_id,answer:'123'})).status,404);
 eq((await call('answer',{job_id:job.id,owner_id:owner,challenge_id:'99999999-9999-9999-9999-999999999999',answer:'123'})).status,409);
 eq((await call('answer',{job_id:job.id,owner_id:owner,challenge_id:challenge.challenge_id,answer:'123'})).accepted,true);
 eq((await call('answer',{job_id:job.id,owner_id:owner,challenge_id:challenge.challenge_id,answer:'456'})).status,409);
 eq((await call('heartbeat',ja)).status,'awaiting_captcha');
 eq((await call('read',{job_id:job.id,owner_id:owner})).status,'awaiting_captcha');
 eq((await call('control',ja)).answer,'123');eq((await call('control',ja)).answer,null);
 eq((await call('read',{job_id:job.id,owner_id:owner})).image_base64,undefined);
 eq((await call('complete',{...ja,result:{status:'unreviewed_preliminary'},source_base64:'c291cmNl',source_sha256:'abc',retrieved_at:new Date().toISOString(),source_as_of:'source date'})).status,'completed');
 eq((await call('complete',ja)).status,409);
 eq((await call('source',{job_id:job.id,owner_id:other})).status,404);
 eq((await call('source',{job_id:job.id,owner_id:owner})).source_base64,'c291cmNl');
 eq((await call('read',{job_id:job.id,owner_id:owner})).result.status,'unreviewed_preliminary');
 const second=await call('create',{worker_id:worker,owner_id:owner,request});await call('poll',{...wa,lease_token:lease});
 await db.exec(`update public.acquisition_jobs set lease_expires_at=now()-interval '1 second' where id='${second.id}'`);
 eq((await call('control',{...wa,lease_token:lease,job_id:second.id})).status,'failed');
 eq((await call('read',{job_id:second.id,owner_id:owner})).failure_code,'session_expired');
 const third=await call('create',{worker_id:worker,owner_id:owner,request});await call('poll',{...wa,lease_token:lease});
 const thirdja={...wa,job_id:third.id,lease_token:lease};const thirdch=await call('challenge',{...thirdja,image_base64:'image'});
 await db.exec(`update public.acquisition_jobs set challenge_expires_at=now()-interval '1 second' where id='${third.id}'`);
 eq((await call('answer',{job_id:third.id,owner_id:owner,challenge_id:thirdch.challenge_id,answer:'1'})).status,409);
 const fourth=await call('create',{worker_id:worker,owner_id:owner,request});
 eq((await call('disconnect',{worker_id:worker,owner_id:other})).status,404);
 eq((await call('disconnect',{worker_id:worker,owner_id:owner})).disconnected,true);
 eq((await call('poll',wa)).status,401);
 eq((await call('read',{job_id:fourth.id,owner_id:owner})).status,'failed');
 const worker2='10000000-0000-0000-0000-000000000002';
 await call('register',{worker_id:worker2,token_hash:token,pairing_hash:'EXPIRED'});
 await db.exec(`update public.acquisition_workers set pairing_expires_at=now()-interval '1 second' where id='${worker2}'`);
 eq((await call('connect',{owner_id:owner,pairing_hash:'EXPIRED'})).status,409);
 await db.exec(`set role authenticated`);let denied=false;try{await db.query('select * from public.acquisition_jobs')}catch{denied=true}eq(denied,true);
 denied=false;try{await call('workers',{owner_id:owner})}catch{denied=true}eq(denied,true);
 console.log(JSON.stringify({sql_security_assertions:checks,passed:true}));await db.close();
})().catch(e=>{console.error(e);process.exit(1)});
'''
@unittest.skipUnless(os.environ.get('ACQUISITION_PGLITE_ROOT'),'optional PostgreSQL WASM runtime not configured')
class SQLTransitionsTests(unittest.TestCase):
    def test_durable_security_transitions(self):
        source=SQL_TEST_JS.replace('/tmp/satyalekh-acq-pg/node_modules/@electric-sql/pglite',os.environ['ACQUISITION_PGLITE_ROOT'])
        with tempfile.TemporaryDirectory() as directory:
            script=Path(directory)/'security.cjs';script.write_text(source)
            result=subprocess.run(['node',str(script),str(Path(__file__).with_name('acquisition_schema.sql'))],capture_output=True,text=True,timeout=60)
        self.assertEqual(result.returncode,0,result.stderr);self.assertTrue(json.loads(result.stdout)['passed'])

if __name__=='__main__':unittest.main()
