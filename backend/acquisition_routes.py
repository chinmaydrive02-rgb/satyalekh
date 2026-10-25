"""Account and outbound-worker API; no browser obtains worker credentials."""
import base64
import re
from typing import Literal, Optional

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, ConfigDict, constr
from acquisition_broker import AcquisitionBroker, decode_payload, digest, owner_id, valid_id

Text = constr(strict=True, strip_whitespace=True, min_length=1, max_length=160)
Secret = constr(strict=True, min_length=32, max_length=128)


class ClosedModel(BaseModel):
    model_config = ConfigDict(extra='forbid')


class Connect(ClosedModel):
    pairing_code: constr(strict=True, pattern=r'^[A-Z2-7]{12}$')


class Job(ClosedModel):
    worker_id: str
    district: Text
    taluka: Text
    village: Text
    survey_no: constr(strict=True, strip_whitespace=True, min_length=1, max_length=64)
    record_type: Literal['VF7'] = 'VF7'


class Lease(ClosedModel):
    worker_id: str
    lease_token: Secret


class Challenge(Lease):
    image_base64: constr(strict=True, min_length=1, max_length=174764)


class Answer(ClosedModel):
    challenge_id: str
    answer: constr(strict=True, pattern=r'^[A-Za-z0-9]{1,12}$')


class Complete(Lease):
    source_base64: constr(strict=True, min_length=1, max_length=1398104)


class Failure(Lease):
    message: Literal['connection_failed', 'portal_unavailable', 'challenge_rejected', 'session_expired',
                     'record_invalid', 'worker_error', 'cancelled'] = 'worker_error'


class PrivateJSONResponse(JSONResponse):
    def __init__(self, *args, **kwargs):
        headers = dict(kwargs.pop('headers', {}) or {})
        headers.update({'Cache-Control': 'no-store', 'Pragma': 'no-cache'})
        super().__init__(*args, headers=headers, **kwargs)


def create_acquisition_router(get_supabase, account_identity, enforce_rate_limit):
    router = APIRouter(prefix='/acquisition', tags=['Record retrieval'], default_response_class=PrivateJSONResponse)

    def broker():
        return AcquisitionBroker(get_supabase())

    def owner(authorization):
        return owner_id(account_identity(authorization))

    def rate(request, bucket='acquisition', limit=60):
        enforce_rate_limit(request, bucket, limit=limit)

    @router.post('/workers/register')
    def register(request: Request):
        rate(request, 'acquisition-register', 3)
        return broker().register()

    @router.post('/workers/connect')
    def connect(body: Connect, request: Request, authorization: Optional[str] = Header(None)):
        rate(request, 'acquisition-connect', 10)
        return broker().call('connect', owner_id=owner(authorization), pairing_hash=digest(body.pairing_code))

    @router.get('/workers')
    def workers(request: Request, authorization: Optional[str] = Header(None)):
        rate(request)
        return broker().call('workers', owner_id=owner(authorization))

    @router.post('/workers/{worker_id}/poll')
    def poll(worker_id: str, request: Request, x_acquisition_worker_token: Optional[str] = Header(None)):
        rate(request, 'acquisition-worker', 120)
        import secrets
        return broker().worker('poll', worker_id, x_acquisition_worker_token,
                               lease_token=secrets.token_urlsafe(32))

    @router.post('/workers/{worker_id}/disconnect')
    def disconnect(worker_id: str, request: Request, authorization: Optional[str] = Header(None)):
        rate(request)
        return broker().call('disconnect', owner_id=owner(authorization), worker_id=valid_id(worker_id))

    @router.post('/jobs')
    def create(body: Job, request: Request, authorization: Optional[str] = Header(None)):
        rate(request, 'acquisition-create', 5)
        values = body.model_dump()
        worker_id = valid_id(values.pop('worker_id'))
        if any(any(ord(c) < 32 for c in value) for value in values.values()):
            raise HTTPException(422, 'Parcel fields must be plain text.')
        return broker().call('create', owner_id=owner(authorization), worker_id=worker_id, request=values)

    @router.get('/jobs/{job_id}')
    def read(job_id: str, request: Request, authorization: Optional[str] = Header(None)):
        rate(request, 'acquisition-read', 120)
        return broker().call('read', owner_id=owner(authorization), job_id=valid_id(job_id))

    @router.post('/jobs/{job_id}/answer')
    def answer(job_id: str, body: Answer, request: Request, authorization: Optional[str] = Header(None)):
        rate(request, 'acquisition-answer', 10)
        return broker().call('answer', owner_id=owner(authorization), job_id=valid_id(job_id),
                             challenge_id=valid_id(body.challenge_id), answer=body.answer)

    @router.post('/jobs/{job_id}/challenge')
    def challenge(job_id: str, body: Challenge, request: Request,
                  x_acquisition_worker_token: Optional[str] = Header(None)):
        rate(request, 'acquisition-worker', 120)
        decode_payload(body.image_base64, 128 * 1024, image=True)
        return broker().worker('challenge', body.worker_id, x_acquisition_worker_token,
                               job_id=valid_id(job_id), lease_token=body.lease_token,
                               image_base64=body.image_base64)

    @router.post('/jobs/{job_id}/control')
    def control(job_id: str, body: Lease, request: Request,
                x_acquisition_worker_token: Optional[str] = Header(None)):
        rate(request, 'acquisition-worker', 120)
        return broker().worker('control', body.worker_id, x_acquisition_worker_token,
                               job_id=valid_id(job_id), lease_token=body.lease_token)

    @router.post('/jobs/{job_id}/heartbeat')
    def heartbeat(job_id: str, body: Lease, request: Request,
                  x_acquisition_worker_token: Optional[str] = Header(None)):
        rate(request, 'acquisition-worker', 120)
        return broker().worker('heartbeat', body.worker_id, x_acquisition_worker_token,
                               job_id=valid_id(job_id), lease_token=body.lease_token)

    @router.post('/jobs/{job_id}/complete')
    def complete(job_id: str, body: Complete, request: Request,
                 x_acquisition_worker_token: Optional[str] = Header(None)):
        rate(request, 'acquisition-worker', 120)
        return broker().complete(body.worker_id, x_acquisition_worker_token,
                                 job_id, body.lease_token, body.source_base64)

    @router.post('/jobs/{job_id}/fail')
    def fail(job_id: str, body: Failure, request: Request,
             x_acquisition_worker_token: Optional[str] = Header(None)):
        rate(request, 'acquisition-worker', 120)
        return broker().worker('fail', body.worker_id, x_acquisition_worker_token,
                               job_id=valid_id(job_id), lease_token=body.lease_token, message=body.message)

    @router.get('/jobs/{job_id}/source')
    def source(job_id: str, request: Request, authorization: Optional[str] = Header(None)):
        rate(request, 'acquisition-source', 10)
        row = broker().call('source', owner_id=owner(authorization), job_id=valid_id(job_id))
        data = decode_payload(row['source_base64'], 1024 * 1024)
        return Response(data, media_type='text/html', headers={
            'Content-Disposition': 'attachment; filename="anyror-vf7-source.html"',
            'Content-Security-Policy': "sandbox; default-src 'none'; form-action 'none'; base-uri 'none'",
            'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'})

    return router
