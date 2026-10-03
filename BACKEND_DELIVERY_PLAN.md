# Satyalekh backend delivery plan

Verified 3 October 2026 against https://satyalekh-api-sg.onrender.com. This is an evidence-based delivery plan, not a claim of complete title clearance.

## What works and what remains blocked

| Capability | Live evidence | Status / next action |
| --- | --- | --- |
| API process and Chromium | `/health/live` 200; `/health` 200 with browser launch | Running. SDK initialization does not prove model generation. |
| Uploaded-document extraction | Non-demo `/analyze-record` 200 in 20.9 seconds, synthetic PDF: Test Owner, TEST-999, 123 square metres, Test Bank mortgage, RED | Working for this English synthetic fixture. Next validate actual authorised Gujarati scans and translations with the lawyer. |
| Gujarat locations | Districts and Ahmedabad talukas 200 | Static lists work; not evidence of portal connectivity. |
| Government village/record retrieval | Ahmedabad / Sanand village lookup 503 after 26.1 seconds | Portal retrieval is unavailable in this test. Hosting geography is an unproven explanation. Do not advertise reliable automated retrieval yet. |
| Screening | `/risk-screen` 200, 3 clear checks and 9 unknown | Rules run; unknown layers are not cleared risks. |
| Reports, watchlist and order persistence | Missing `title_reports`, `watchlist`, `watchlist_alerts`, `manual_orders` tables created via Supabase migration `provision_backend_storage` | RLS enabled, backend service-role access only. API watchlist and order reads still 502 after migration; inspect deployed Supabase URL/key and logs. |
| Monitoring | `/watchlist/run-checks` 503: cron secret unset | Not running. A secret alone does not create a scheduler or fix the source. |
| News | `/news/gujarat` 503: provider not configured | Needs provider configuration or an honest unavailable state. |
| DigiLocker | OAuth/document functions raise not-live errors | Requires approval, credentials and implementation, not just an environment toggle. |
| Certified documents / 30-year manual reports | Request API exists; no verified fulfilment partner or delivery process | Do not promise a turnaround until a named fulfiller and a completed test order exist. No purchases or real orders were made in this audit. |

## Delivery sequence and acceptance gates

1. **Restore storage access.** Sign in to Render; verify `SUPABASE_URL` matches `uvvwqugljoritqbjcryg`, set a valid server-only Supabase service credential in `SUPABASE_SERVICE_KEY`, redeploy. Never put this key in `NEXT_PUBLIC_*`, commit it, or loosen RLS to make a test pass. Validate real non-demo watchlist create/read/delete with a reserved test email and cleanup; confirm the report cache and request storage work. `/health/ready` checks all four tables with zero-row queries and returns 503 on failure.
2. **Secure user ownership before private/client use.** Add Supabase sign-in; send and validate bearer JWTs; derive owner from authenticated user ID instead of typed email. Add owner columns and scoped policies to portfolio, locker, reports, watchlist and requests. Make the locker bucket private. Current dashboard reads all portfolio rows, locker trusts typed email, and backend email-based routes do not authenticate ownership. Prove two test accounts cannot read or change each other's records or files; include alert-seen and delete operations.
3. **Deliver the reliable upload-first path.** Keep the existing scraper as an optional source, but let users upload an official record when unavailable. Preserve original source, page references, Gujarati text, English translation, record date, extraction confidence and missing fields. Build a persisted preliminary report from that evidence, with explicit unsupported checks and a lawyer-review step. Validate readable, blurred, incomplete, restricted-tenure and mortgaged records against known facts. Current upload endpoint returns extracted fields and a risk flag; that alone is not a complete persisted diligence report.
4. **Make work survive restarts.** Replace process-memory jobs / ephemeral SQLite with Supabase job rows, idempotency keys, worker leases, bounded retries, progress and recorded failures. Persist report results before marking jobs complete. Restart a worker mid-job and prove safe recovery and one final result. Never describe `JOB_DB_PATH` on free Render as durable storage.
5. **Diagnose and prove Gujarat retrieval.** Compare official-portal connectivity, response codes and selector behavior from the deployed worker and a local network; inspect failures before selecting hosting. Respect source refusals and cooldowns. Use supported access or user-assisted acquisition when automated access is unavailable. Verify district → taluka → village → survey → record plus mutation evidence on several authorised real parcels; a successful health check or demo fixture does not satisfy this gate. Do not spend on an Indian server before showing geography is the cause.
6. **Enable monitoring only after retrieval works.** Add protected scheduler credentials, an actual scheduler and persistent per-parcel last-success / failure / overdue state. Prove a known snapshot change produces an alert and that unavailable sources appear overdue rather than unchanged. Show a last-checked timestamp in the interface.
7. **Build full diligence cases.** Accept and organise deeds, Index-2/registration records, encumbrance evidence, complete mutation documents, land-use/tenure evidence and scoped litigation searches. Track evidence gaps, contradictions and lawyer-reviewed conclusions. Current litigation search covers one requested year and the first court complex; no matches do not establish absence of litigation. Full title clearance requires a documented search scope beyond a 7/12.
8. **Activate additional offers only with proof.** Implement DigiLocker OAuth after approval. Configure manual fulfilment partners, request confirmation, status tracking and delivery proof. News is optional and must not block reports. Keep existing UI features but label availability accurately; coverage/trust/investor copy must not promise unverified daily monitoring or certified delivery.

## Four-week implementation order

- Week 1: server storage credential, ownership/authentication, private locker and access-isolation verification.
- Week 2: upload-first evidence/report pipeline, source-linked translation and lawyer comparison on authorised Gujarati records.
- Week 3: persistent jobs, restart recovery, retrieval diagnostics and real parcel acceptance tests.
- Week 4: conditional monitoring, review/export workflow, availability copy and end-to-end mobile verification. DigiLocker and manual fulfilment depend on outside approval/partners and are not guaranteed within the month.

## Hosting and costs

Keep the existing Vercel frontend, Render API and Supabase database while validating the product. No paid accounts, card entry, hosting upgrade or domain purchase is authorised by this plan. Render free services sleep after 15 minutes of inactivity, take about a minute to wake, and lose local files on restart/redeploy/spin-down: https://render.com/docs/free. Durable data belongs in Supabase/storage. This free setup is suitable for a prototype with visible cold-start and failure states; it cannot promise continuously available background processing. Revisit hosting only after measured load and reliability requirements are known.

## Next-agent brief

Start with step 1 and the live `/health/ready` result, not a redesign or new features. Inspect Render environment/logs without exposing secrets; authenticate storage safely; exercise non-demo CRUD and cleanup. Then implement step 2 before collecting client documents. Preserve the original dirty checkout at `/Users/chinmaymistry/Downloads/SATYALEKH`; use the managed release checkout for source changes. Treat demo outputs as fixtures and label them. Update this matrix with dated live evidence for each completed gate.
