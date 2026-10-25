# AnyROR delivery status — 25 October 2026

This checkpoint supersedes the historical October21 plan below.

## Real retrieval proved

A genuine VF7 for Gandhinagar / Kalol / અઢાણા - 039 / survey3 was retrieved locally using a human-entered CAPTCHA. Six ownership rows and three rights rows survive reading and draft generation. Source as-of is6April2024 02:06:42, distinct from retrieval date. Original33242-byte source SHA256: d56150759e0a88ae576c0bb1e484f160fb207719a6552db156644b864ea23877. Private artifacts: /Users/chinmaymistry/Documents/SatyalekhAcquisition/vf7-session-20261025-06/. Deployed analyze-record independently accepted all rows and the same hash without externalAI. Missing mutation refs:2683,3144,3773,3933,3943,4004,4068. Draft remains unreviewed/preliminary, not chain-complete.

Actual transport fix: observed POST302 to allowlisted Info712Details.aspx followed by same-session GET with rural-form Referer. Generic redirects remain rejected. Only rural-submit HTML is searched for result-window script. Never reuse CAPTCHA answers.

## Website delivery release

Implemented /retrieve: owner pairs an outbound connector, requests exactVF7 parcel, answers the official CAPTCHA on Satyalekh, receives original rows/draft, continues existing upload/review/save. /retrieve/connector includes downloadable httpx-only connector. Existing features preserved.

Actual Supabase migration backend/acquisition_schema.sql applied successfully25October2026 through SQLeditor. New private RLS tables; no anon/authenticated access; service-role atomic RPC handles pairing, leases, one-use answers, expiry/revocation. Tokens hashed; worker credentials only in connector memory. Dedicated heartbeat does not consume answers. Completed sources/results remain private in jobs; no zero-retention claim.

Validation:494 backend tests passed including realPostgreSQL/PGlite security assertions; additional focused heartbeat test passes. Frontend Webpack production build and TypeScript pass. Local Turbopack failed due missing nativeSWC, not app compilation. Connector imports in a clean environment with onlyhttpx.

Release/deploy and genuine website-job acceptance pending at this checkpoint. Hosted Render still cannot reach AnyROR. Connected computer must stay awake with connector running. Pairing10minutes, worker8hours, job15minutes, local CAPTCHA wait up to10minutes; upstream may expire sooner. VF7 only; VF6/VF8A acquisition and full ownership-chain proof remain outstanding.

## Next acceptance

1. Release tested additive change; verify both deployed commits and actualRPC.
2. Start backend/anyror_worker.py; pair on signed-in /retrieve. User authorizes connection and enters current CAPTCHA on website. Never extract browser tokens.
3. Request sample above; verify source/hash/rows/as-of, then user reviews/saves/reopens/exports. Do not auto-attest legal review.
4. Add explicitVF6/VF8A acquisition, validate seven linked entries. References alone are not transfer evidence.
5. Cloud-only24/7 still needs proven available portal connectivity; no paid service provisioned.

---

## Historical checkpoint (superseded)

# AnyROR delivery status

Updated 21 October 2026. Read this before the historical plans in `ANYROR_AUTOMATION_PLAN.md`.

## Current evidence

| Capability | Evidence | Remaining gate |
|---|---|---|
| Local HTTP form automation | 54 Kalol villages; 602 Adhana survey options; exact survey 3 present | Repeat after upstream changes |
| Production HTTP village lookup | PR18 deployed; last live response 503 before form loading | Hosted connection remains unavailable |
| VF7 parcel preparation | Local CLI reached the real embedded CAPTCHA for Gandhinagar/Kalol/Adhana/survey3 | User challenge completion |
| Challenge/result transport | Offline cookie, hidden-field, one-shot, expiry, route and source-reader tests pass | Genuine result response and exact parcel validation |
| Record reading | Existing local VF7 reader retains every owner/right, source date and hash | Compare newly retrieved source against its reading |
| Reports | Existing uploaded-source review/report workflow | Genuine retrieved source → review → signed-in save/reopen/export |
| Linked evidence | Existing VF6 reader/bundle; prior genuine source research | HTTP VF6 acquisition; VF8A reader/acquisition; exact linked bundle proof |
| Hosted local-worker connection | Design only | Owner-scoped durable jobs and outbound worker not implemented |

The new code is an interactive local acquisition tool. It does not add a hosted retrieval endpoint, install a background service, solve CAPTCHA automatically, or establish 24-hour availability. Existing scraper/AI/report features remain available. A successful dropdown sequence is not a land record or title clearance.

## Running the narrow acceptance path

From `backend`, use a new private output directory for each attempt:

```sh
python3 acquire_anyror_vf7.py --district Gandhinagar --taluka Kalol \
  --village 'અઢાણા - 039' --survey 3 --output /absolute/private/new-session-directory
```

The tool opens one verified-TLS session, selects exact options, saves the displayed CAPTCHA locally and waits up to three minutes for the operator's answer. The portal embeds the current PNG as a data URI; it is decoded locally with raster/type/size limits. The answer is submitted once with the actual submit button and fresh hidden fields. The tool follows only an observed literal `window.open` to the known official VF7 result route; redirects and other result protocols currently stop the attempt.

The existing strict reader must accept the returned HTML. District, taluka, village and survey must match the selected official labels. The only village-label relaxation removes the form's trailing three-digit village code. There is no nearby/fuzzy parcel fallback. On success, `source.html` and `source-reading.json` are saved with restrictive permissions, including the source hash, source date, acquisition time and review requirement. The challenge image is removed after submission or input timeout. No genuine owner data is committed or sent to an external AI provider by this tool.

## Next delivery order

1. Finish one real CLI run with a user-supplied CAPTCHA answer. If the portal uses an unsupported response route, record its sanitized structure and add only that observed, allowlisted case with tests. Do not guess result URLs or treat a rejection page as acceptance. Failure consumes the session; start a fresh lookup with a fresh challenge.
2. Compare all owners, rights, identifiers, area units and source date with the returned source. Import `source.html` into the existing review workflow. Complete genuine signed-in save/reopen/export and cross-account denial checks. Do not auto-attest review on the user's behalf.
3. Implement VF6 entry4068 and VF8A khata255 with explicit input/result adapters and anonymised fixtures. Validate the references against survey3. A mutation reference alone is not a proved transfer chain.
4. Connect the demonstrated acquisition to the website only after the source flow passes. Use owner-scoped jobs with short leases, claim tokens, expiry and idempotent completion. A local worker should poll outbound; never expose an inbound Mac port or ship Supabase/Gemini service credentials to a browser. The worker's session and challenge must stay bound to its job and owner. Return a recoverable awaiting-user state while CAPTCHA is pending.
5. Prove job restart/reclaim, stale and duplicate completion rejection, account isolation and offline-worker handling before scheduling. A local computer must be running for a local worker to work. Hosted AnyROR connectivity remains a separate unresolved prerequisite for a cloud-only service.

## Completion evidence required

Actual official source for the requested parcel; exact identity comparison; complete raw ownership/rights preservation; preliminary report with missing evidence visible; signed-in save/reopen/export; account isolation; failure/expiry recovery; exact deployed commits and live production acceptance. Until these pass, automatic record retrieval is incomplete.
