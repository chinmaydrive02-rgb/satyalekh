"""Local static VF6 extraction, not a finding about transfer or title validity."""
import hashlib
from anyror_vf7_reader import SavedPage, PREFIX, MAX_BYTES, _clean_text, _visible
from local_document_reader import LocalDocumentError

METHOD = "local_anyror_vf6_saved_html"
# These are observed result spans, never request controls or search parameters.
FIELDS = {
    "entry_no": "lblEntryNo", "entry_date": "lblEdt",
    "decision_date": "lblStatusDt", "effective_date": "lblEffDt",
    "change_type": "lblTrnpname", "status": "lblEnpos",
    "office_status": "lblStatus", "narrative": "lblRemarks",
    "affected_surveys": "lblSNoS", "officer_remarks": "lblResult",
    "application_no": "lblAppNo", "original_change_type": "lblMainTrntp",
    "applicant_name": "lblAppName", "application_date": "lblAppDt",
    "notice_prepared_date": "lblNoticeDt", "notice_given_date": "lblNoticeGiven",
    "last_notice_served_date": "lblLastNoticeDt",
}
LOCATIONS = {"district": "lblDistrict", "taluka": "lblTaluka", "village": "lblVillage"}
LABELS = {
    "entry_no": "Entry Number (નોંધ નંબર)", "entry_date": "નોંધ તારીખ",
    "decision_date": "નોંધના નિર્ણયની તારીખ", "effective_date": "નોંધની અસર આપ્યા તારીખ",
    "change_type": "ફેરફારનો પ્રકાર", "status": "નોંધની સ્થિતિ", "office_status": "કચેરીમાં સ્થિતિ",
    "narrative": "નોંધની વિગત", "affected_surveys": "ફેરફારને સંબંધિત સરવે નંબર (ખાતા નંબર)",
    "officer_remarks": "તપાસણી કરનાર અધિકારી નો શેરો",
}
LIMITS = {"narrative": 12000, "officer_remarks": 6000, "affected_surveys": 4000}


def _fail(detail="Supply a complete, unambiguous saved AnyROR VF6 result page."):
    raise LocalDocumentError(422, detail)


def read_anyror_vf6_html(contents):
    """Return native source strings with no network, translation or party inference.

    Empty date/status spans remain empty; a missing span means an unsupported
    layout and is rejected. Applicant is not assumed to be buyer or owner.
    """
    if not isinstance(contents, bytes) or not contents:
        _fail()
    if len(contents) > MAX_BYTES:
        raise LocalDocumentError(413, "Saved HTML exceeds the 1 MB local reading limit.")
    try:
        html = contents.decode("utf-8-sig", errors="strict")
    except UnicodeError:
        _fail("Save the original VF6 page as UTF-8 HTML.")
    page = SavedPage()
    try:
        page.feed(html)
        page.close()
    except (RecursionError, ValueError):
        _fail()
    visible = _clean_text(page.root)
    if not all(marker in visible for marker in ("VF-6", "સત્તાવાર નકલ", *LABELS.values())):
        _fail()
    if PREFIX + "grdKhata" in page.ids or PREFIX + "lblSurveyNo" in page.ids:
        _fail("This is not a standalone VF6 mutation result.")

    def read(ident, limit=500, nonempty=False):
        node = page.ids.get(PREFIX + ident)
        if node is None or node.tag != "span" or not _visible(node):
            _fail()
        text = _clean_text(node)
        if nonempty and not text:
            _fail("The VF6 result lacks essential identity or narrative evidence.")
        if len(text) > limit:
            _fail("A VF6 field exceeds the local reading limit; no text was truncated.")
        return text

    locations = {key: read(ident, nonempty=True) for key, ident in LOCATIONS.items()}
    asof = read("lblProc_dt", nonempty=True)
    mutation = {key: read(ident, LIMITS.get(key, 500), key in {"entry_no", "narrative", "affected_surveys"})
                for key, ident in FIELDS.items()}
    if sum(map(len, mutation.values())) > 24000:
        _fail("The VF6 record exceeds the combined local text limit; no text was truncated.")
    source = {"record_type": "VF6", "informational": True, "source_as_of": asof,
              "locations": locations, "identifiers": {"entry_no": mutation["entry_no"]},
              "labels": LABELS.copy(), "raw_fields": mutation.copy(), "review_required": True}
    values = {**locations, "source_as_of": asof, **mutation}
    evidence = [{"field": key, "value": value, "snippet": value, "page": 1,
                 "method": METHOD, "confidence": "unverified_source_reading"}
                for key, value in values.items() if value]
    return {"mutation_record": mutation, "source_record": source, "evidence": evidence,
            "raw_text": "[Page 1]\n" + "\n".join(f"{LABELS.get(key, key)}: {value}" for key,value in values.items()),
            "metadata": {"reader": "local", "method": METHOD, "record_type": "VF6",
                         "external_processing": False, "translation_performed": False,
                         "source_sha256": hashlib.sha256(contents).hexdigest(), "source_bytes": len(contents),
                         "source_mime_type": "text/html", "pages_total": 1, "pages_processed": 1,
                         "truncated": False, "manual_review_required": True, "review_required": True,
                         "official_source_verified": False,
                         "warnings": ["Informational VF6 portal copy; preserve its source date separately from retrieval time.",
                                      "Native mutation text is unverified; no buyer, seller, owner or legal effect has been inferred.",
                                      "A single mutation entry does not establish a complete chain of title."]}}
