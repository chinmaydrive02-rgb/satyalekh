"""Synthetic VF6 structure; no real personal record contents."""
import hashlib
import unittest
from anyror_vf6_reader import read_anyror_vf6_html, FIELDS, LOCATIONS, LABELS
from local_document_reader import LocalDocumentError


def fixture(overrides=None):
    values = {ident: "નમૂના માહિતી" for ident in (*FIELDS.values(), *LOCATIONS.values())}
    values.update(lblEntryNo="૧પ", lblEdt="01/02/2024", lblStatusDt="03/02/2024", lblEffDt="04/02/2024",
                  lblProc_dt="તા.05/02/2024 ની સ્થિતિએ", lblRemarks="નમૂના નોંધની વિગત <સંદર્ભ> એકમાત્ર અરજદારનો ઉલ્લેખ",
                  lblSNoS="૩ (નમૂના ખાતું), ૪ (બીજું ખાતું)", lblResult="નમૂના અધિકારીનો શેરો")
    values.update(overrides or {})
    from html import escape
    spans = ''.join(f'<div><span id="ContentPlaceHolder1_{key}">{escape(value)}</span></div>' for key,value in values.items())
    return ('<!doctype html><html><body><form>VF-6 સત્તાવાર નકલ નથી ' + ' '.join(LABELS.values()) + spans + '</form></body></html>').encode()


class VF6Tests(unittest.TestCase):
    def test_native_facts_and_original_hash_without_party_inference(self):
        data=fixture(); r=read_anyror_vf6_html(data);m=r['mutation_record']
        self.assertEqual(m['entry_no'],'૧પ')
        self.assertEqual(m['entry_date'],'01/02/2024')
        self.assertEqual(m['decision_date'],'03/02/2024')
        self.assertEqual(m['effective_date'],'04/02/2024')
        self.assertIn('<સંદર્ભ>',m['narrative'])
        self.assertEqual(m['affected_surveys'],'૩ (નમૂના ખાતું), ૪ (બીજું ખાતું)')
        self.assertEqual(r['source_record']['raw_fields'],m)
        self.assertEqual(r['metadata']['source_sha256'],hashlib.sha256(data).hexdigest())
        self.assertTrue(r['source_record']['informational'])
        self.assertFalse(r['metadata']['external_processing'])
        self.assertFalse(r['metadata']['translation_performed'])
        self.assertTrue(r['metadata']['review_required'])
        self.assertEqual(r['metadata']['reader'],'local')
        for key in ['buyer','seller','owner_name','report','risk_level']:self.assertNotIn(key,r);self.assertNotIn(key,m)
        self.assertTrue(all(e['page']==1 and e['confidence']=='unverified_source_reading' for e in r['evidence']))

    def reject(self,data):
        with self.assertRaises(LocalDocumentError):read_anyror_vf6_html(data)

    def test_blank_dates_remain_unknown_not_inferred(self):
        r=read_anyror_vf6_html(fixture({'lblStatusDt':'','lblEffDt':'','lblEnpos':''}))
        self.assertEqual(r['mutation_record']['decision_date'],'')
        self.assertEqual(r['mutation_record']['effective_date'],'')
        self.assertEqual(r['mutation_record']['status'],'')
        self.assertNotIn('decision_date',[e['field'] for e in r['evidence']])

    def test_missing_or_duplicate_or_hidden_identity_refused(self):
        self.reject(fixture().replace(b'lblEntryNo',b'badEntry'))
        self.reject(fixture().replace(b'</body>',b'<span id="ContentPlaceHolder1_lblEntryNo">999</span></body>'))
        self.reject(fixture().replace(b'id="ContentPlaceHolder1_lblEntryNo"',b'hidden id="ContentPlaceHolder1_lblEntryNo"'))
        self.reject(fixture({'lblEntryNo':''}))
        self.reject(fixture({'lblRemarks':''}))

    def test_script_controls_error_and_wrong_record_refused(self):
        self.reject(b'<html><form>VF-6 <select><option>Entry Number</option></select>error</form></html>')
        data=fixture().replace('૧પ'.encode(),b'<script>FAKE</script><select><option>FAKE</option></select>')
        self.reject(data)
        good=fixture().replace(b'</form>',b'<script>NOT EVIDENCE</script><input value="NOT EVIDENCE"></form>')
        self.assertNotIn('NOT EVIDENCE',read_anyror_vf6_html(good)['raw_text'])
        self.reject(fixture().replace(b'VF-6',b'VF-7'))
        self.reject(fixture().replace(b'</form>',b'<span id="ContentPlaceHolder1_lblSurveyNo">3</span></form>'))

    def test_encoding_and_resource_limits(self):
        for data in [b'',b'\xff\xfe',b'%PDF-not-html',b' '*(1024*1024+1),b'<html>'+b'<div>'*70,b'<html>'+b'<br>'*12001]:self.reject(data)
        self.reject(fixture({'lblRemarks':'x'*12001}))
        self.reject(fixture({'lblResult':'x'*6001}))
        self.reject(fixture({'lblSNoS':'x'*4001}))
        self.reject(fixture({'lblEntryNo':'x'*501}))
        r=read_anyror_vf6_html(fixture({'lblRemarks':'x'*12000}))
        self.assertEqual(len(r['mutation_record']['narrative']),12000)

if __name__=='__main__':unittest.main()
