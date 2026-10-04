"""Strict, local-only reader for saved AnyROR VF7 HTML; all facts need review."""
import hashlib
import re
from html.parser import HTMLParser
from local_document_reader import LocalDocumentError

MAX_BYTES = 1024 * 1024
MAX_NODES = 12000
MAX_DEPTH = 64
MAX_VALUE = 2000
PREFIX = "ContentPlaceHolder1_"
METHOD = "local_anyror_saved_html"
BLOCKED = {"script", "style", "select", "option", "button", "input", "textarea", "template", "noscript", "iframe", "object", "svg"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


def fail(detail="This is not a complete, unambiguous saved AnyROR VF7 record."):
    raise LocalDocumentError(422, detail)


class Node:
    def __init__(self, tag, attrs, parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []

    def text(self):
        return " ".join(" ".join(c.text() if isinstance(c, Node) else c for c in self.children).split())

    def descendants(self, tag):
        for child in self.children:
            if isinstance(child, Node):
                if child.tag == tag:
                    yield child
                yield from child.descendants(tag)


class SavedPage(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root", [])
        self.stack = [self.root]
        self.ids = {}
        self.nodes = 0

    def handle_starttag(self, tag, attrs):
        self.nodes += 1
        if self.nodes > MAX_NODES or len(self.stack) >= MAX_DEPTH:
            fail("Saved HTML exceeds the local structural limit.")
        if len([key for key, _ in attrs]) != len(set(key for key, _ in attrs)):
            fail("Ambiguous repeated HTML attributes require a clearer original export.")
        node = Node(tag, attrs, self.stack[-1])
        ident = node.attrs.get("id")
        if ident:
            if ident in self.ids:
                fail("Duplicate HTML identifiers require a clearer original export.")
            self.ids[ident] = node
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def _visible(node):
    while node:
        attrs = node.attrs
        style = re.sub(r"\s", "", (attrs.get("style") or "").lower())
        if node.tag in BLOCKED or "hidden" in attrs or attrs.get("aria-hidden") == "true" or "display:none" in style or "visibility:hidden" in style:
            return False
        node = node.parent
    return True


def _clean_text(node):
    if not _visible(node):
        return ""
    return " ".join(" ".join(_clean_text(c) if isinstance(c, Node) else c for c in node.children).split())


def _bounded(value):
    if len(value) > MAX_VALUE:
        fail("A record field exceeds 2,000 characters. Use a smaller source extract for review.")
    return value


def read_anyror_vf7_html(contents, mime_type="text/html"):
    if mime_type != "text/html" or not isinstance(contents, bytes) or not contents:
        fail("Supply a non-empty saved HTML VF7 page.")
    if len(contents) > MAX_BYTES:
        raise LocalDocumentError(413, "Saved HTML exceeds the 1 MB local reading limit.")
    try:
        html = contents.decode("utf-8-sig", errors="strict")
    except UnicodeError:
        fail("Save the original VF7 page as UTF-8 HTML.")
    page = SavedPage()
    try:
        page.feed(html)
        page.close()
    except (RecursionError, ValueError):
        fail()
    visible = _clean_text(page.root)
    if not all(label in visible for label in ("VF-7", "Ownership Details", "Boja and Other Rights Details", "સત્તાવાર નકલ")):
        fail()

    def get(name, tag="span", required=True):
        node = page.ids.get(PREFIX + name)
        if node is None or node.tag != tag or not _visible(node):
            if required:
                fail()
            return None
        return node

    def value(name, required=True):
        node = get(name, required=required)
        result = _bounded(_clean_text(node)) if node else ""
        if required and not result:
            fail()
        return result

    labels = {name: value(name) for name in ("lblDistrict", "lblTaluka", "lblVillage", "lblSurveyNo", "lblTotArea", "lblTenure", "lblProc_dt")}

    def table(name, width):
        node = get(name, "table")
        if list(node.descendants("table")):
            fail()
        rows, kinds = [], []
        for row in node.descendants("tr"):
            cells = [c for c in row.children if isinstance(c, Node) and c.tag in ("th", "td")]
            if not cells or len(cells) != width or any(c.attrs.get("rowspan", "1") != "1" or c.attrs.get("colspan", "1") != "1" for c in cells):
                fail()
            rows.append([_bounded(_clean_text(c)) for c in cells])
            kinds.append("header" if all(c.tag == "th" for c in cells) else "data")
        if not rows or kinds[0] != "header":
            fail()
        separators = [i for i, row in enumerate(rows) if any(row) and all(not cell or re.fullmatch(r"-{3,}", cell) for cell in row)]
        if len(separators) != 1:
            fail("Unrecognised VF7 table grouping requires manual source review.")
        split = separators[0]
        if split < 1 or any(kind == "header" for kind in kinds[1:]):
            fail()
        return rows, split

    ownership, oi = table("grdKhata", 2)
    rights_rows, ri = table("grdBojaOthr", 1)
    owners = [row[1] for row in ownership[oi + 1:] if row[1]]
    rights = [row[0] for row in rights_rows[ri + 1:] if row[0]]
    if not owners:
        fail("The saved record has no readable ownership rows.")
    # Preserve native strings, including ambiguous Gujarati letter પ; no numeric guesses.
    fields = {"owner_name": _bounded("\n".join(owners)), "survey_no": labels["lblSurveyNo"],
              "total_area": _bounded(labels["lblTotArea"] + " H.Are.SqMt."), "tenure_type": labels["lblTenure"],
              "encumbrances": _bounded("\n".join(rights)) or "Unknown"}
    if "H.Are.SqMt." not in visible:
        fail("The original area units are missing; no unit has been inferred.")
    source = {"source_as_of": labels["lblProc_dt"], "informational": True,
              "raw_ownership_rows": ownership, "raw_rights_rows": rights_rows,
              "owners": owners, "rights": rights,
              "mutation_refs": {"ownership_unclassified": ownership[1:oi], "rights_unclassified": rights_rows[1:ri]},
              "account_rows": [row[0] for row in ownership[oi + 1:] if row[0]],
              "locations": {"district": labels["lblDistrict"], "taluka": labels["lblTaluka"], "village": labels["lblVillage"]},
              "identifiers": {"survey_no": labels["lblSurveyNo"], "upin": value("lbl_upin", False), "old_survey_no": value("lblOldSurveyNo", False)},
              "additional_source_fields": {name: value(name, False) for name in ("lblProDetail", "lblOld_E_O_NO", "lblTotAss", "lblLanduse", "lblFarmName", "lblRemarks")}}
    evidence = [{"field": key, "value": val, "snippet": val, "page": 1, "method": METHOD,
                 "confidence": "unverified_source_reading"} for key, val in fields.items() if val != "Unknown"]
    raw_text = "[Page 1]\n" + "\n".join([f"{k}: {v}" for k,v in labels.items()] + [" | ".join(r) for r in ownership + rights_rows])
    return {**fields, "evidence": evidence, "raw_text": raw_text, "source_record": source,
            "metadata": {"reader": "local", "method": METHOD, "external_processing": False, "translation_performed": False,
                         "manual_review_required": True, "review_required": True, "official_source_verified": False,
                         "source_sha256": hashlib.sha256(contents).hexdigest(), "source_bytes": len(contents), "source_mime_type": mime_type,
                         "pages_total": 1, "pages_processed": 1, "truncated": False,
                         "warnings": ["Informational portal copy, not a certified record. Preserve the source date separately from retrieval time.",
                                      "Gujarati source retained without legal classification; all ownership and rights rows require review."]}}
