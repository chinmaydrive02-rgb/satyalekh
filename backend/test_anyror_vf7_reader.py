"""Anonymised structural fixtures; no real owner or property identifiers."""
import hashlib
import unittest
from anyror_vf7_reader import read_anyror_vf7_html, MAX_BYTES
from local_document_reader import LocalDocumentError


def fixture(owners=6, rights=3, continuation_refs=True, blank_rows=0):
    values = {"lblProc_dt": "તા.06/04/2024 02:06:42 ની સ્થિતિએ", "lblDistrict": "નમૂના જિલ્લો",
              "lblTaluka": "નમૂના તાલુકો", "lblVillage": "નમૂના ગામ", "lblSurveyNo": "૩",
              "lblTotArea": "૦-૧૦-૦૦", "lblTenure": "નમૂના સત્તાપ્રકાર", "lbl_upin": "SYNTHETIC-NOT-A-REAL-UPIN",
              "lblOldSurveyNo": "પ", "lblOld_E_O_NO": "નમૂના જૂની નોંધ ૧પ"}
    spans = ''.join(f'<span id="ContentPlaceHolder1_{key}">{value}</span>' for key,value in values.items())
    header = '<tr><th>ખાતા નંબર | ક્ષેત્રફળ | આકાર |</th><th>નોંધ નંબરો તથા ખાતેદાર</th></tr>'
    refs = '<tr><td> </td><td>૧પ,૨૩,</td></tr>' + ('<tr><td></td><td>૪૦,</td></tr>' if continuation_refs else '')
    divider = '<tr><td>-----</td><td>-----</td></tr>'
    rows = ''.join(f'<tr><td>{"૧ | ૦-૧૦-૦૦ | ૧.૦૦" if i == 0 else ""}</td><td>નમૂના ખાતેદાર {i+1}(૧પ)</td></tr>' for i in range(owners))
    rows += '<tr><td></td><td> </td></tr>' * blank_rows
    right_rows = ''.join(f'<tr><td>નમૂના હક નિવેદન {i+1}&lt;૧પ&gt;</td></tr>' for i in range(rights))
    return ('<!doctype html><html><body><form>HOME RURAL LAND RECORD VF-7 '
            'Ownership Details Boja and Other Rights Details H.Are.SqMt. સત્તાવાર નકલ નથી '
            + spans + '<table id="ContentPlaceHolder1_grdKhata"><tbody>' + header + refs + divider + rows + '</tbody></table>'
            '<table id="ContentPlaceHolder1_grdBojaOthr"><tbody><tr><th>બોજા અને બીજા હક્ક ની વિગતો</th></tr>'
            '<tr><td>૧પ,</td></tr><tr><td>-----</td></tr>' + right_rows + '</tbody></table></form></body></html>').encode()


class SavedVF7Tests(unittest.TestCase):
    def test_three_structural_variants_preserve_every_row(self):
        for owners, rights, continuation, blanks in [(6,3,True,0),(4,2,False,0),(1,6,False,3)]:
            with self.subTest(owners=owners):
                data=fixture(owners,rights,continuation,blanks)
                result=read_anyror_vf7_html(data)
                source=result['source_record']
                self.assertEqual(len(source['owners']),owners)
                self.assertEqual(len(source['rights']),rights)
                self.assertEqual(len(source['raw_ownership_rows']),3+int(continuation)+owners+blanks)
                self.assertEqual(len(source['raw_rights_rows']),3+rights)
                self.assertEqual(source['identifiers']['old_survey_no'],'પ')
                self.assertEqual(source['owners'][0],'નમૂના ખાતેદાર 1(૧પ)')
                self.assertEqual(source['source_as_of'],'તા.06/04/2024 02:06:42 ની સ્થિતિએ')
                self.assertEqual(result['metadata']['source_sha256'],hashlib.sha256(data).hexdigest())
                self.assertTrue(result['metadata']['review_required'])
                self.assertFalse(result['metadata']['external_processing'])
                self.assertEqual(result['metadata']['reader'],'local')
                self.assertTrue(source['informational'])
                self.assertNotIn('report',result)
                self.assertEqual(result['owner_name'],'\n'.join(source['owners']))
                self.assertEqual(result['encumbrances'],'\n'.join(source['rights']))
                self.assertTrue(all(e['page']==1 and e['method']=='local_anyror_saved_html' for e in result['evidence']))

    def assert_rejected(self,data):
        with self.assertRaises(LocalDocumentError):read_anyror_vf7_html(data)

    def test_controls_and_script_never_become_facts(self):
        data=fixture().replace('નમૂના જિલ્લો'.encode(),b'<script>INJECTED</script><select><option>CONTROL</option></select>')
        self.assert_rejected(data)
        self.assert_rejected(b'<html><form><select><option>VF-7</option></select></form></html>')
        data=fixture().replace('નમૂના જિલ્લો'.encode(),'નમૂના જિલ્લો'.encode()+b'<script>INJECTED</script><input value="CONTROL">')
        r=read_anyror_vf7_html(data)
        self.assertNotIn('INJECTED',r['raw_text'])
        self.assertNotIn('CONTROL',r['raw_text'])

    def test_missing_sections_duplicate_ids_and_units(self):
        self.assert_rejected(fixture().replace(b'grdBojaOthr',b'wrongTable'))
        self.assert_rejected(fixture().replace(b'</body>',b'<span id="ContentPlaceHolder1_lblSurveyNo">999</span></body>'))
        self.assert_rejected(fixture().replace(b'H.Are.SqMt.',b'unspecified units'))
        self.assert_rejected(fixture().replace(b'id="ContentPlaceHolder1_lblSurveyNo"',b'id="bad" id="ContentPlaceHolder1_lblSurveyNo"'))

    def test_hidden_required_fields_and_wrong_kind(self):
        self.assert_rejected(fixture().replace(b'id="ContentPlaceHolder1_lblSurveyNo"',b'hidden id="ContentPlaceHolder1_lblSurveyNo"'))
        self.assert_rejected(fixture().replace(b'id="ContentPlaceHolder1_lblSurveyNo"',b'style="display: none" id="ContentPlaceHolder1_lblSurveyNo"'))
        self.assert_rejected(b'%PDF-1.5 not html')
        self.assert_rejected(b'\xff\xfe')
        with self.assertRaises(LocalDocumentError):read_anyror_vf7_html(fixture(),'application/pdf')

    def test_ambiguous_table_never_silently_drops_rows(self):
        self.assert_rejected(fixture().replace(b'<td>-----</td><td>-----</td>',b'<td>unknown separator</td><td>-----</td>'))
        self.assert_rejected(fixture().replace(b'<td>-----</td><td>-----</td>',b'<td colspan="2">-----</td>'))
        self.assert_rejected(fixture().replace(b'<td>-----</td><td>-----</td>',b'<td><table><tr><td>-----</td></tr></table></td><td>-----</td>'))

    def test_limits_reject_without_truncation(self):
        self.assert_rejected(b' '*(MAX_BYTES+1))
        self.assert_rejected(fixture().replace('નમૂના જિલ્લો'.encode(),b'x'*2001))
        self.assert_rejected(fixture(owners=150))
        self.assert_rejected(b'<html>'+b'<div>'*70+b'x'+b'</div>'*70+b'</html>')
        self.assert_rejected(b'<html>'+b'<br>'*12001+b'</html>')

    def test_blank_rights_remains_unknown(self):
        result=read_anyror_vf7_html(fixture(rights=0))
        self.assertEqual(result['encumbrances'],'Unknown')
        self.assertEqual(result['source_record']['rights'],[])
        self.assertEqual(len(result['source_record']['raw_rights_rows']),3)


if __name__=='__main__':unittest.main()
