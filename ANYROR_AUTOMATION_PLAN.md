# AnyROR acquisition delivery plan

Updated 10 October 2026. Goal: retrieve the selected parcel and supporting records, preserve their evidence, and generate a preliminary report without inventing ownership or clearance.

## What the evidence establishes

- Gemini PDF/image extraction and Gujarati-to-English report generation were restored and verified on synthetic uploads in release 908734f.
- Render Singapore and Vercel Mumbai both resolved AnyROR DNS but timed out establishing TCP, before TLS, forms or CAPTCHA. Changing country alone did not solve the connection.
- The user's browser has successfully loaded the official VF7 form and cascading district, taluka and village lists. Genuine VF7/VF6/VF8A pages were previously retrieved with user-assisted challenges.
- The local automated worker is not a proven replacement. On 10 October, the repaired village lookup returned 503 in 12.015 seconds with ERR_CONNECTION_RESET during navigation, before any form selection. Earlier local navigation returned HTTP500. Do not describe this as a confirmed geography ban or a completed local worker.
- Form reliability defects also existed: village lookup omitted record-type selection; full retrieval relied on a fixed sleep after selecting it; missing search controls could proceed toward submission.

## This release

Both acquisition flows now select the record type before location and await the actual postback. The initializer accepts a completed partial postback even when district options remain unchanged, and handles full document replacement. Search submission stops if its required input is unavailable. Chromium uses its installed default browser identity. Initial connection is one bounded 20-second attempt; the existing shared cooldown applies on failure. Existing record types, Gemini, local uploads, mutation bundles and report features remain available.

These repairs improve the acquisition implementation; they do not make an unreachable host reachable. Live retrieval must remain labelled unavailable until the complete flow passes.

## Next build: browser-assisted acquisition

Build a small desktop browser companion that works in the user's own official AnyROR tab. This is the first candidate because that connection has worked, and it requires no new paid cloud account. It is not yet implemented or accepted.

1. Satyalekh prepares a parcel request with exact record type, district, taluka, village and survey/entry/khata identifier. A short-lived, single-use handoff binds it to the initiating user and tab.
2. The companion operates only on allowlisted AnyROR rural form/result pages. It fills each supported control in order, waiting for each postback and refusing ambiguous or missing identifiers. It must not select a nearby parcel as a fallback.
3. Pause for the user to complete the portal CAPTCHA or other access challenge. Automatic form filling and capture can surround this step, but this is assisted acquisition, not unattended scraping.
4. Once the portal displays a result, validate its record type, location and identifier before offering import. Capture the displayed source, record its acquisition time and source date separately, and hash the imported bytes. Label a DOM capture as a browser capture, not an authenticated server original or certified copy.
5. Send the user's chosen source to the existing Satyalekh upload/review flow through a validated first-party handoff. Never embed a Supabase service key or Gemini key in the companion. Restrict permissions, message origins, payload size and lifetime; do not transmit unrelated tabs, browser cookies, history or credentials.
6. Retrieve referenced VF6 entries and linked VF8A accounts using the same process. Track missing records explicitly. Add VF8A parsing and identity tests before claiming a complete linked bundle. Preserve all holders and rights rows; a mutation reference alone does not establish a transferor/transferee relationship.

First acceptance is a synthetic companion-to-upload round trip with strict origin, expiry, replay and account-isolation checks. Then the owner installs the reviewed companion and completes one real portal challenge. Compare VF7 plus a referenced VF6 and linked VF8A against the report before extending coverage. Do not deploy an untested extension as a finished capability.

## Route to unattended operation

Reliable 24-hour acquisition requires a permitted, demonstrably reachable service connection or an official data integration, and an allowed way to handle challenges. An Indian server, proxy purchase, longer timeout or additional AI key is not evidence of that access. Do not rotate identities, disable certificate checks or expose a public port on the owner's Mac.

After access is proven, use durable owner-scoped job storage with leases, explicit queued/running/awaiting-user/succeeded/failed states, idempotent completion and bounded retry/cooldown. Keep service credentials on the server. The browser-assisted path must remain usable when an unattended worker is offline. Verify restart recovery, concurrent ownership isolation, source identity matching and incomplete-chain reporting before enabling scheduling/watchlists.

## Completion gates

- Actual official record returned for the exact requested parcel, not only district/village options.
- Source and rendered report compared, including all holders, rights, units, record date and identifiers.
- Supporting VF6/VF8A references matched; unknown and missing evidence retained.
- Real signed-in save/reopen/export round trip, with another account unable to access the report.
- Portal refusal, timeout, wrong parcel, expired session and CAPTCHA failure leave a clear recoverable state.
- Deployment health verified and handoff updated with exact commits and observed results.

Until those gates pass, the working delivery route is uploaded records plus review. No claim of universal automated scraping, complete title clearance or unsupervised availability is supported.
