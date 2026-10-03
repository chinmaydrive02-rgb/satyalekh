# Satyalekh security delivery review

Reviewed 3 October 2026. Code review of the managed release checkout; database observations come from the delivery plan. This is not a penetration-test certification. Do not use prototype storage for confidential client material until the isolation gate below passes.

## Immediate risk and code evidence

| Priority | Finding | Affected path | Delivery requirement |
| --- | --- | --- | --- |
| Critical | Browser queries portfolio rows without an owner filter; table policy allows all visitors. | `frontend/src/app/dashboard/page.tsx`, `backend/schema.sql` | Authenticated user-ID ownership and database RLS. A UI filter alone is insufficient. |
| Critical | Locker uses typed email and a deterministic hash as a folder. Public bucket and unrestricted object policies permit direct access outside the UI. Signed URLs do not protect a public bucket. | `frontend/src/app/locker/page.tsx`, `backend/schema.sql` | Private bucket, authenticated folder ownership, owner-scoped metadata policies, authenticated account UI. |
| High | Watchlist and fulfilment APIs trust supplied email. A service-role database client bypasses RLS, so a restored server credential makes API authorization essential. | `backend/main.py`: watchlist/order routes | Verify bearer token with Supabase Auth and scope every query/mutation to its immutable user ID. For temporary compatibility, derive email exclusively from the verified identity. |
| High | Alert-seen accepts only a watchlist ID; no owner check. Job polling accepts only a job ID. UUID secrecy is not authorization. | `backend/main.py`: `mark_alerts_seen`, `get_job_status` | Select an owned watchlist before updating alerts; associate private jobs/results with the authenticated user and reject other users. |
| High | Credits and checkout use supplied email; original money tables have blanket public policies. | `backend/main.py`, `backend/schema.sql` | Backend-only grants, authenticated billing owner, signed Stripe webhook; atomic balance updates before enabling payments. Keep payments disabled until verified. |
| Medium | First forwarded IP is trusted without a documented proxy trust boundary; rate buckets/jobs are process-local. | `backend/main.py`: `_client_ip`, `_enforce_rate_limit` | Confirm Render's header sanitisation; do not assume arbitrary user-supplied forwarded headers are trustworthy. Persistent quotas and bounded shared workers are needed before scale. |
| Medium | Provider exception logs may contain document content, identity or metadata. Dependencies are largely unpinned. | `backend/main.py`, `backend/requirements.txt` | Structured error codes without payloads/tokens; dependency lock and vulnerability review. |

## Prepared implementation

`backend/authentication.py` validates an explicit bearer token using `supabase.auth.get_user(token)`, which performs server verification. It returns an immutable user ID and confirmed account email, rejects anonymous/unconfirmed/deleted identities, and fails closed on provider errors. It never decodes an unverified JWT, trusts user metadata, sets the shared client's session, or prints credentials. `backend/test_authentication.py` covers malformed credentials, invalid identity, provider rejection/outage and metadata spoofing. This helper alone does not secure a route until integrated.

Current API documentation: [Supabase Python get_user](https://supabase.com/docs/reference/python/auth-getuser). Database policies: [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security). Storage: [Supabase storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## Coordinated rollout preserving existing features

1. Verify the deployed backend's project and server-only service credential without exposing it. A storage readiness success is operational evidence, not an access-control success.
2. Add a Supabase account flow and a single frontend request helper that sends the access token. Add `Authorization` to backend CORS allowed headers. Keep public demo fixtures isolated from real rows. Private features must display a sign-in state when unauthenticated.
3. Protect real watchlist/alerts/manual-order/credits routes. Validate the token before accessing data. Derive account email on the server while adding `user_id` columns; never let body/header/query email select a different account. Alert updates must first find an owned watchlist. Use user ID for final ownership, not mutable email.
4. Add owner UUIDs referencing `auth.users` on portfolio, locker metadata, reports, watchlists and orders. Existing rows with unknown owners stay inaccessible until verified; do not auto-claim them solely because a new account types a matching email. Export a restricted backup before the migration; do not delete legacy rows.
5. Replace broad policies with authenticated owner policies. Include both `USING` and `WITH CHECK` for updates, and ownership checks for insert/delete. Money/internal cache/job tables stay service-only unless a specific read policy is needed. Service-role backend queries still require explicit owner predicates.
6. Set locker bucket private and use paths beginning with authenticated user UUID. Object policies must require `bucket_id = 'lockers'` and first folder = `auth.uid()`. Do not leave a second blanket policy that grants access through Postgres' permissive-policy OR behavior. Restrict MIME types/size at the bucket; continue validation on the application side. Existing legacy paths require a verified migration or quarantined access.
7. Protect private job polling and report cache reads. Separate shared public-source cache from user-uploaded documents, notes and client matters. Do not place confidential evidence in a globally reusable parcel report cache.
8. Implement authenticated export/deletion, retention enforcement, consent record/version and incident audit trail in coordination with the legal review. Store no document bodies/access tokens in activity logs. Define processor transfers and actual retention before publishing promises.

## Release gate

Use two disposable verified test accounts A and B plus an unauthenticated client. A creates a synthetic watchlist, alert, request, portfolio row and private file. B must not read, edit, delete, mark seen, poll the private job or sign/download the file, through either API or direct Supabase access. Anonymous operations must fail. A's expected operations must succeed. Also prove guessed emails, edited owner UUIDs and a forged unsigned token do not bypass checks; confirmation and revoked/deleted-user paths fail closed. Clean up test users/files/rows. Record status codes and table/object policies; do not claim isolation solely from unit mocks.

## Operational next steps

Require MFA on owner/admin provider accounts; keep server credentials in Render and publishable keys in the browser. Rotate a secret only if exposure is found, not merely because it was read securely. Document backup/recovery behavior and actually restore a synthetic record. Persistent jobs need idempotency/leases and bounded retry; free Render filesystem cannot satisfy recovery. Create an incident contact and a notification runbook reflecting the verified legal timeline. Test failure states so unavailable retrieval appears unavailable, never as a clear title or unchanged parcel.

## Implementation update

Bearer verification and owner UUID predicates are integrated into watchlist/create/read/delete/alerts, manual requests, title job creation/polling and report-cache reads/writes. Alert-seen verifies the owned parent before mutation. Credit and raw retrieval APIs require verified identity; checkout does when payments are enabled. Demo jobs require a valid demo token when polled. Existing unowned reports/jobs are not claimable. Frontend Auth rollout and database ownership migration are coordinated separately; live isolation proof remains required. Application tests use a fake service-role database that deliberately applies no RLS, so account isolation must come from the actual API query predicates.
