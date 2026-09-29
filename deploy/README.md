# Satya-Lekh deployment and operating plan

Status: deployment configuration prepared locally; no server provisioned, domain purchased, DNS changed, or production deployment performed.

## Architecture and limitations

Keep the existing Next.js frontend on Vercel. Run FastAPI and Chromium on an always-on Indian Linux server, with Caddy providing automatic HTTPS and a persistent Docker volume for job history. Retain Supabase for existing report, watchlist and account storage.

Start with one API process and one concurrent portal scrape. Do not add Uvicorn workers or replicas: throttling, active jobs, demo sessions and request limits are process-local. SQLite preserves completed job results across restarts. Interrupted jobs explicitly fail and can be retried by the user; this is NOT an automatically replayed durable queue. Results retain the existing two-hour expiry policy.

Indian hosting is a hypothesis to test, not a guarantee of AnyROR access. Before committing to a long hosting term, verify portal navigation from the actual server, then test a known parcel and compare the report against its official record. Explicit 403/429 responses now stop retrieval and trigger a cooldown. Do not use repeated retries to overcome a refusal.

## Deployment

1. Choose an Indian server with at least 2 GB RAM for initial low-volume evaluation; measure Chromium memory before accepting production load. Enable provider backups and security updates. Record its IPv4 address.
2. Install Docker Engine with the Compose plugin from the official Docker instructions. Enable Docker at boot. Restrict SSH to administrator IPs; expose only 80/443 publicly.
3. Clone the repository and enter `deploy`. Copy `.env.example` to `.env`, restrict it to the server administrator (`chmod 600 .env`), and fill in credentials securely. Never commit `.env` or paste secrets into shell history. Use the backend service-role key only on the server.
4. Set the domain's `api` A record to the server address. Leave any AAAA record absent unless IPv6 is configured. Set API_DOMAIN to that hostname.
5. Run `docker compose --env-file .env -f compose.yaml up -d --build`. The API has no published public port; Caddy proxies to it internally.
6. Verify `https://api.<domain>/health/live` returns 200. This is liveness only; it does not assert government portal or AI availability. The existing `/health` is a heavier diagnostic and should not be used for frequent monitoring.
7. Set NEXT_PUBLIC_API_URL in Vercel to `https://api.<domain>` and redeploy the frontend. Add the apex and www domains in the Vercel project; use the exact DNS records Vercel supplies. Pick one canonical domain and configure the other to redirect there.
8. Confirm CORS from both intended frontend domains and test search, upload, report printing, demo, navigation and mobile flows. Verify report values against official documents before enabling payments.

## Operations required before public launch

- External uptime monitoring every five minutes against `/health/live` and the frontend, with an owner-selected alert destination. A monitor is not configured by these files.
- Docker restarts crashed processes and after host reboot. An unhealthy-but-running container is NOT restarted by Compose. Configure host-level monitoring/remediation separately and test it before claiming unattended recovery.
- Enable daily provider snapshots and Supabase backups appropriate to the plan. Test a restore. Use SQLite's backup API for an application-consistent job export; copying only the main WAL database file is unsafe.
- Watchlist scheduling: the existing authenticated POST `/watchlist/run-checks` needs a scheduler and CRON_SECRET. Confirm real user authentication/authorization before enabling watchlist automation or paid access; the current email-header account model is not sufficient proof of ownership.
- Set cloud and AI billing alerts. Track portal refusal rate, report failures, queue time, disk use and memory. Do not make a paid report from unreadable or incomplete source data.
- For multiple API instances or automated job recovery, replace process-local state with a shared durable queue, leases, idempotent credit accounting and authenticated job ownership first.

## Release and rollback

Keep a tested image tag and database backup before release. Deploy only after tests and a production frontend build pass. Verify a real record after deployment. If regression occurs, restore the previous image and frontend deployment; preserve the jobs volume. Do not use `docker compose down -v` in normal operations.

Use a unique `API_IMAGE` value for each release (for example `satyalekh-api:release-001`) in `deploy/.env`. Build and test that image before switching the API:

```sh
docker compose --env-file .env config --quiet
docker compose --env-file .env build api
docker compose --env-file .env up -d --no-build
docker compose --env-file .env ps
```

To roll back, restore the previous `API_IMAGE` value and run `docker compose --env-file .env up -d --no-build api`. Confirm the previous image still exists locally before changing the setting. Do not rebuild the old tag from new source, prune release images, or delete the jobs volume. Database format changes need their own tested restore/migration procedure; changing an image tag does not undo a database migration.

The verification workflow runs backend tests, frontend type checking and a production build. It also validates Compose, builds the actual backend image, launches Chromium during that build, and probes the API using a placeholder AI key. These checks require no cloud secrets and generate no AI or government-portal requests. They do not prove live scraping, translation, database permissions or report accuracy. The workflow validates changes only; it does not deploy them, and existing provider Git integrations may deploy independently. Confirm provider deployment settings and required checks before relying on CI as a production gate.

The Docker image currently installs the Chromium revision required by the pinned Playwright Python package on top of a newer browser base image. This is intentionally retained for runtime compatibility but duplicates browser files. A smaller image and dependency lockfile remain follow-up work after a verified container build. Most Python dependencies and the Caddy image still use floating versions; builds are not fully reproducible. Retaining each tested image is therefore required for reliable rollback.

## Cost and domain decision

Compare first-year AND renewal domain prices at checkout. Prefer `satyalekh.in` for an India-focused service if available and cheaper; availability is unverified because the connected domain lookup failed. Do not purchase without confirming the actual price.

DigitalOcean lists Bangalore hosting: https://www.digitalocean.com/pricing/droplets . Compare an always-on Indian server against your existing provider before provisioning. Vercel Hobby is limited to personal/non-commercial use: https://vercel.com/docs/plans/hobby . Budget for the appropriate frontend plan if running commercially. AI usage, backups, database and domain renewal are additional costs.

## Free-first option

Oracle Always Free can be evaluated if an Indian home region and eligible capacity are available. Confirm the current allowance in the account console; do not rely on the older 4 OCPU / 24 GB instructions in this repository. Free instances may be reclaimed when idle, so this is an evaluation option rather than an uptime guarantee. Account signup, identity/card verification and terms acceptance must be completed by the owner. An ARM instance also needs a verified compatible Chromium/container build; the current Docker image has not been tested on ARM here.

References: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm and https://docs.public.content.oci.oraclecloud.com/iaas/Content/FreeTier/resourceref.htm .

The current free Render service sleeps after 15 minutes without traffic and loses local filesystem changes on restart/redeploy: https://render.com/docs/free . Do not enable JOB_DB_PATH there without persistent storage. Keep the existing free frontend address during evaluation; a custom domain is a separate purchase.
