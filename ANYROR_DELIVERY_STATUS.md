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
