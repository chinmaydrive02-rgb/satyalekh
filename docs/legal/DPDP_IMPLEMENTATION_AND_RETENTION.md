# Privacy implementation and launch gates

Reviewed 3 October 2026 against release source and the backend delivery plan. This is a legal/product implementation memo, not a compliance certificate. Draft notices are intentionally unpublished until owner facts and technical controls are verified. CTO changes in progress require a fresh evidence update.

## Legal phase and source register

G.S.R. 843(E) stages the Act: institutional provisions commenced on publication, Consent Manager provisions follow after one year, and most processing duties/rights follow after eighteen months. G.S.R. 846(E), Rule 1 similarly stages the Rules. Therefore most DPDP operational duties are **not yet commenced on 3 October 2026**. Use **13 November 2026** and **13 May 2027** as conservative calculated readiness dates from the printed Gazette date, subject to later official clarification; electronic identifiers show 14 November. The December corrigendum changes wording, not those intervals. Recheck before launch and those milestones. Section 43A/SPDI review remains relevant pending the deferred statutory amendment; do not treat the transition as a privacy holiday.

- [Act commencement: G.S.R. 843(E)](https://egazette.gov.in/WriteReadData/2025/267647.pdf).
- [DPDP Act 2023 official text](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf). A public website alone does not establish the public-data exclusion; record its statutory/publication basis. Uploader permission is not every named person's consent.
- [Rules: G.S.R. 846(E)](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf). Design for itemised notice, withdrawal, safeguards, rights, complaints, children and legally required retention. Future breach reporting involves immediate communications and a detailed Board report within 72 hours; future security/processing retention provisions include one-year requirements. Do not promise universal immediate erasure.
- [Corrigenda: G.S.R. 892(E)](https://www.meity.gov.in/static/uploads/2025/12/3c7ebbae0e5456f493f486e6845df86b.pdf).
- [CERT-In directions](https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf) and [official FAQs](https://www.cert-in.org.in/PDF/FAQs_on_CyberSecurityDirections_May2022.pdf): assess applicability now; listed incident reporting has a six-hour deadline and ICT-log retention is rolling 180 days with Indian-jurisdiction requirements. Keep this distinct from DPDP reporting; no GDPR-only template.
- [Gemini API current terms](https://ai.google.dev/gemini-api/terms): unpaid processing permits improvement use and human review and restricts sensitive/confidential/personal inputs. Billing classification must be proven. Paid-service data-processing treatment is different, but must not be activated under the current no-payment constraint.

The source review found no basis to announce that Satyalekh is a registered Consent Manager, a Significant Data Fiduciary, government approved, ISO certified, bank approved or affiliated with Khaitan. Those statements must not be made. Consider SPDI, consumer, professional-confidentiality, intermediary and banking/vendor requirements separately for the actual operating model.

## Actual data flows and gaps

| Flow observed | Current gap/risk | Delivery acceptance |
|---|---|---|
| `POST /analyze-record` reads up to 10 MB and transmits document bytes to Gemini 2.5 Flash; returns English extracted fields and risk explanation | No verified provider classification, account-linked collection notice or confidential-input gate. Synthetic success does not validate Gujarati fidelity or privacy | Verify permitted vendor arrangement or use a non-personal/local/manual route; record source-linked extraction and reviewed translation |
| Title report jobs use email hints, location cache and source/AI processing | Cache sharing can expose client-added facts; caller email does not authenticate ownership | Separate legitimately public source cache from private matter evidence/results; authorise all job polling/report access |
| Locker uses browser Supabase access, typed email, stable weak path prefix and signed-link creation | Original policies/bucket were public; signed links and unguessable names alone do not prevent access | Authenticated owner UUID, private bucket, scoped object/table policies; prove two-account isolation and revocation |
| Portfolio, watchlist, alerts and fulfilment requests use email keyed rows | Broken or unauthenticated storage is not a private account; alerts/read/deletes can be sensitive | Verify JWT ownership on every read/write/delete/alert operation and migrate legacy rows without attaching them to an unverified claimant |
| Watchlist intended daily comparisons; manual orders intended partner delivery | No confirmed running scheduler/source/partner | Obtain a defined scope and lawful sharing basis; distinguish requested, accepted and delivered; show service unavailable until real delivery proof |
| Logs, maps, provider infrastructure and browser-local email/demo state | No verified retention/deletion/region inventory; shared devices can retain state | Publish actual provider inventory and browser-storage explanation, minimise identifiers, test sign-out and cleanup |

Original source evidence: `backend/main.py`, `backend/scraper.py`, `frontend/src/app/locker/page.tsx`, `frontend/src/lib/api.ts`, `backend/schema.sql`, `BACKEND_DELIVERY_PLAN.md`. Production configuration is a separate evidence requirement. Do not paste secrets or client documents into this memo or public issue trackers.

## Prioritised launch work

1. **Ownership and confidentiality:** CTO must test authenticated owner isolation and private storage before admitting client files. If restoring a service credential makes unauthenticated endpoints readable, readiness has improved while confidentiality has not. Fix both.
2. **Vendor and lawful-use gate:** owner supplies actual Google project classification, approved contracts, provider inventory and authority/source basis. Do not make client-record submission depend on a disclaimer. Under no-spend constraints, use synthetic/non-personal demonstrations and local/redacted/manual review while confidential AI processing is unresolved.
3. **Collection controls:** deploy plain notices at upload, saving, monitoring and onward-sharing actions. Record notice version, user, purpose, timestamp, affirmative action and revocation. Keep authority and consent distinct; allow English/Gujarati/Hindi selection with reviewed translations. No forced homepage agreement box is needed.
4. **Rights and retention:** monitored contact with assigned handler; inventory exports/corrections/erasure across database, objects, caches, jobs and providers. Automate verified deletion, preserve restricted legally required records, and prevent deleted accounts being recreated by job retries/backups. Restore tests must replay deletion tombstones.
5. **Incident readiness:** owner appoints contact and alternate; CTO documents containment, evidence preservation, provider escalation and applicable reporting clocks. Logs should record access/ownership and consent events without document contents, secrets or unnecessary identifiers. Test one tabletop incident before real client use.
6. **Delivery integrity:** owner reviews benchmark Gujarati records and scope of preliminary vs professional reports. Report every unperformed title check. Remove unverified advertising claims about completeness, certification, confidentiality or live fulfilment; preserve the feature and show its real state.

## Retention design for owner approval

These are proposed engineering targets, **not current guarantees or universal statutory periods**. Configure only after counsel resolves the retention basis and provider terms. Separate operational access from restricted mandatory retention. The future Rules' one-year provisions require a specific scope assessment, not a blanket 30-day deletion claim.

| Category | Proposed operational rule | Required exception/control |
|---|---|---|
| Transient upload for analysis | Process in memory; remove working copies after response/failure; no automatic locker save | Determine whether required statutory processing records include payload; do not send prohibited inputs to vendor. Verify framework temp files/provider handling |
| Saved locker source and final matter report | Retain while the user maintains the matter; accessible deletion request/control | Approved mandatory retention/legal holds in segregated restricted storage; backup expiry disclosed |
| Failed job intermediate content | Short diagnostic window, proposed 7 days, then purge | No full documents in logs; restricted incident hold when required |
| Public-source cache | Proposed 24-hour freshness for record facts; use source/publication basis and source date | Distinguish cache expiry from legally required processing records; never cache client additions publicly |
| Watchlist snapshot/alerts | Retain while enabled; stop new checks promptly on withdrawal; proposed historical purge 30 days after removal | Restricted mandatory records/hold, clearly communicated |
| Consent, access and security records | Preserve minimum evidence and access logs for applicable duties; design one-year future DPDP scope and current CERT-In requirement | Confirm India log copy/availability, restricted access and no payload logging |
| Accepted service orders and financial records | Actual statutory/accounting/professional period determined by entity/service | No invented seven-year rule; no payment collection currently promised |
| Backup copies | Provider-confirmed expiry window recorded in register | Tombstones, re-deletion after restore and limited access; no promise of instantaneous provider erasure |

## Owner decisions that cannot be invented

- Legal operating identity, constitution and business address; relationship with any employer, professional practice or partners.
- A public, monitored privacy/grievance contact and responsible person. The email given for account creation has not been authorised for public grievance publication.
- Adult-only business service boundary, treatment of records mentioning minors, and a lawful route for guardianship cases.
- Who is fiduciary/processor for client matters, account purposes, analytics and fulfilment; obligations may differ per purpose. A bank/law-firm contract does not eliminate Satyalekh's own purposes.
- Approved provider/project classification, confidentiality instructions, geographic processing and contracts. Never activate billing or promise India-only hosting without verification.
- Retention periods and holds, request response service levels, accepted professional-service scope, fees/refunds, dispute terms and permitted marketing.

## Minimum verification evidence before publication

- Anonymous request rejected; user A cannot list/open/change/delete user B's rows or documents; private object URL fails; legitimate signed link expires.
- Upload cannot bypass personal-data/provider gate; permitted test generates expected fields without unnecessary content in logs.
- Notices visible before collection on phone and desktop; no preselected optional choice; consent receipt and withdrawal work.
- Rights request reaches a monitored handler; verified export/correction/deletion covers all stores; restore does not resurrect deleted accessible material.
- Provider/retention register approved; incident contacts assigned; reporting exercise completed; source and report scope checked by owner.

Only then finalise and publish `PRIVACY_NOTICE_DRAFT.md` and `TERMS_AND_CONSENT_DRAFT.md`. Owner legal review is substantive: drafting text alone cannot make an insecure service compliant.


## Owner confirmation and implementation update — 3 October 2026
Owner confirmed chinmaydrive02@gmail.com as the monitored privacy/grievance email and confirmed unpaid Gemini. Legal operator name/entity and business address remain unanswered. Do not publish placeholder policies. Backend now defaults to local PDF/OCR reading, with original Gujarati retained and no automatic translation. External personal-data analysis is disabled unless a permitted arrangement is verified and explicitly configured. Supabase secure_account_ownership migration applied: private locker, owner UUID policies, backend-only tables; SQL two-identity portfolio isolation passed in a rolled-back transaction. Existing one portfolio record and two locker records/files preserved unassigned. Auth email delivery, live accounts, object isolation and admin legacy migration still need proof.
