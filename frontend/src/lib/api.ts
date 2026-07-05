// Central API configuration
// Uses NEXT_PUBLIC_API_URL from .env.local (defaults to localhost:8000 for dev)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://satyalekh-api-sg.onrender.com";

export async function fetchFromAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return res;
}

// ─── Demo mode ───────────────────────────────────────────────────────────────
// Login-gated demo (backend /demo/login) — sample data, real product flow.
// The token lives in localStorage for 24h; while valid, an X-Demo-Token
// header is attached to title-report / watchlist / options requests and the
// backend serves realistic fixtures instead of live scrapes.

const DEMO_TOKEN_KEY = "sl_demo_token";
const DEMO_EXPIRY_KEY = "sl_demo_expiry";

/** Email used for demo watchlist rows (never a real account). */
export const DEMO_EMAIL = "demo@satya-lekh.example";

/** The stored demo token if it exists and hasn't expired, else null. */
export function getDemoToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = window.localStorage.getItem(DEMO_TOKEN_KEY);
    const expiry = Number(window.localStorage.getItem(DEMO_EXPIRY_KEY) || 0);
    if (!token || !expiry || Date.now() >= expiry) return null;
    return token;
  } catch {
    return null;
  }
}

export function isDemoActive(): boolean {
  return getDemoToken() !== null;
}

export function exitDemo(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEMO_TOKEN_KEY);
    window.localStorage.removeItem(DEMO_EXPIRY_KEY);
  } catch {
    // localStorage unavailable — ignore
  }
}

/** `{ "X-Demo-Token": ... }` when a valid unexpired token exists, else {}. */
export function demoHeaders(): Record<string, string> {
  const token = getDemoToken();
  return token ? { "X-Demo-Token": token } : {};
}

export async function demoLogin(
  username: string,
  password: string
): Promise<{ demo_token: string; expires_in: number }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/demo/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new ApiError(
      0,
      "Could not reach the backend. It may be cold-starting (60–90s on free hosting) — please retry in a minute."
    );
  }
  if (res.status === 401) {
    throw new ApiError(401, "That username or password didn't match — please check and try again.");
  }
  if (!res.ok) {
    throw new ApiError(res.status, `Demo login failed (HTTP ${res.status}). Please try again.`);
  }
  const data = (await res.json()) as { demo_token: string; expires_in: number };
  try {
    window.localStorage.setItem(DEMO_TOKEN_KEY, data.demo_token);
    window.localStorage.setItem(DEMO_EXPIRY_KEY, String(Date.now() + data.expires_in * 1000));
  } catch {
    // localStorage unavailable — session-only demo
  }
  return data;
}

// ─── Title-report jobs (async scrape + poll) ────────────────────────────────
// POST /jobs/title-report starts a background scrape job on the backend and
// returns a job_id immediately (202). GET /jobs/{id} reports live progress.
// This replaces the old blocking /fetch-anyror call for the core flow.

export type JobStatus = "queued" | "running" | "done" | "error";

export type JobStage =
  | "connecting"
  | "selecting_location"
  | "solving_captcha"
  | "reading_record"
  | "fetching_chain"
  | "building_report";

/** Ordered stages shown in the live progress checklist. */
export const JOB_STAGES: { key: JobStage; label: string }[] = [
  { key: "connecting",         label: "Connecting to the AnyROR government portal" },
  { key: "selecting_location", label: "Selecting district, taluka and village" },
  { key: "solving_captcha",    label: "Solving the government CAPTCHA (AI vision)" },
  { key: "reading_record",     label: "Reading the 7/12 land record" },
  { key: "fetching_chain",     label: "Fetching mutation history (chain of title)" },
  { key: "building_report",    label: "Building your ownership report" },
];

export interface LandRecord {
  status?: string;
  message?: string;
  owner_name?: string;
  survey_no?: string;
  village?: string;
  district?: string;
  taluka?: string;
  area?: string;
  tenure_type?: string;
  cultivation?: string;
  mutation_entries?: string;
  encumbrances?: string;
  jantri_rate?: string;
  last_sale?: string;
  [key: string]: unknown;
}

export interface ChainEntry {
  entry_no: string;
  date: string;
  mutation_type: string;
  from_party: string;
  to_party: string;
  description: string;
  flags: string[];
}

export type CheckStatus = "pass" | "warn" | "fail" | "unavailable";

export interface RiskCheck {
  name: string;
  status: CheckStatus;
  detail: string;
}

export type RiskVerdict = "CLEAR" | "CAUTION" | "HIGH_RISK";

export interface TitleRisk {
  score: number; // 0-100
  verdict: RiskVerdict;
  checks: RiskCheck[];
}

export interface TitleReport {
  record: LandRecord;
  chain_of_title: ChainEntry[];
  risk: TitleRisk;
  generated_at: string;
  cached: boolean;
}

export interface Job {
  job_id: string;
  status: JobStatus;
  stage?: JobStage;
  stage_label?: string;
  progress: number; // 0-100
  result?: TitleReport;
  error?: string;
  suggestions?: string[];
}

export interface StartTitleReportParams {
  district: string;
  taluka: string;
  village: string;
  survey_no: string;
  record_type?: string;
  include_chain?: boolean;
}

/** Error carrying the HTTP status so callers can branch (402 paywall etc.). */
export class ApiError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function startTitleReport(
  params: StartTitleReportParams,
  email?: string
): Promise<{ job_id: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...demoHeaders(), // demo mode: valid token → simulated backend job
  };
  if (email) headers["X-User-Email"] = email;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/jobs/title-report`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        district: params.district,
        taluka: params.taluka,
        village: params.village,
        survey_no: params.survey_no,
        record_type: params.record_type || "OLD_SCAN_712",
        include_chain: params.include_chain ?? true,
      }),
    });
  } catch {
    throw new ApiError(
      0,
      "Could not reach the backend. It may be cold-starting (60–90s on free hosting) — please retry in a minute."
    );
  }

  if (res.ok || res.status === 202) {
    const data = await res.json().catch(() => ({}));
    if (!data.job_id) throw new ApiError(res.status, "Backend did not return a job id.");
    return { job_id: data.job_id as string };
  }

  const errBody = await res.json().catch(() => ({} as { detail?: unknown }));
  const detail =
    typeof errBody.detail === "string"
      ? errBody.detail
      : `Could not start the title search (HTTP ${res.status}).`;
  throw new ApiError(res.status, detail);
}

export async function getJob(jobId: string, signal?: AbortSignal): Promise<Job> {
  const res = await fetch(`${API_BASE_URL}/jobs/${encodeURIComponent(jobId)}`, { signal });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({} as { detail?: unknown }));
    const detail =
      typeof errBody.detail === "string" ? errBody.detail : `Job lookup failed (HTTP ${res.status}).`;
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as Job;
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export interface PollJobOptions {
  signal?: AbortSignal;
  onUpdate?: (job: Job) => void;
  /** Poll interval in ms (default 2500). */
  intervalMs?: number;
  /** Consecutive network blips tolerated before giving up (default 5). */
  maxTransientFailures?: number;
}

/**
 * Polls GET /jobs/{id} every `intervalMs` until the job reaches a terminal
 * state ("done" | "error"). Network blips during polling are treated as
 * transient and retried a few times before failing. Abort via `signal`.
 */
export async function pollJob(jobId: string, opts: PollJobOptions = {}): Promise<Job> {
  const { signal, onUpdate, intervalMs = 2500, maxTransientFailures = 5 } = opts;
  let transientFailures = 0;

  for (;;) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const job = await getJob(jobId, signal);
      transientFailures = 0;
      onUpdate?.(job);
      if (job.status === "done" || job.status === "error") return job;
    } catch (e) {
      if (isAbortError(e)) throw e;
      // A 404 means the job genuinely doesn't exist — not transient.
      if (e instanceof ApiError && e.status === 404) throw e;
      transientFailures += 1;
      if (transientFailures > maxTransientFailures) {
        throw new ApiError(
          0,
          "Lost connection while tracking the search. It may still be running on the server — please retry in a minute."
        );
      }
    }
    await sleep(intervalMs, signal);
  }
}

/**
 * Parses the legacy "...Available options (first 15): ['1', '2 P', ...]"
 * error text into a list of survey-number suggestions. The new jobs API
 * returns `suggestions[]` directly; this is kept as a fallback.
 */
export function parseSurveySuggestions(message?: string | null): string[] {
  if (!message) return [];
  const match = message.match(/Available options \(first \d+\): \[(.*?)\]/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => s.replace(/['"]/g, "").trim())
    .filter(Boolean);
}

// ─── Credits / payment helpers ──────────────────────────────────────────────
// Lightweight email-based credit tracking (no auth system yet).
// The email is stored locally and sent as X-User-Email on /fetch-anyror calls.

export interface CreditsInfo {
  email: string;
  credits: number;
  payments_enabled: boolean;
}

const EMAIL_STORAGE_KEY = "sl_user_email";

export function getUserEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(EMAIL_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setUserEmail(email: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email.trim().toLowerCase());
  } catch {
    // localStorage unavailable — ignore
  }
}

export async function fetchCredits(email: string): Promise<CreditsInfo | null> {
  if (!email) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/credits?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return (await res.json()) as CreditsInfo;
  } catch {
    return null;
  }
}

// ─── Public config (no email needed) ────────────────────────────────────────

export interface AppConfig {
  payments_enabled: boolean;
  free_trial_credits: number;
  price_single_inr: number;
  price_pack5_inr: number;
}

let _configCache: AppConfig | null = null;

export async function fetchConfig(): Promise<AppConfig | null> {
  if (_configCache) return _configCache;
  try {
    const res = await fetch(`${API_BASE_URL}/config`);
    if (!res.ok) return null;
    _configCache = (await res.json()) as AppConfig;
    return _configCache;
  } catch {
    return null;
  }
}

// ─── Watchlist (daily re-check + change alerts) ─────────────────────────────
// Backend endpoints:
//   POST   /watchlist                      → upserted row
//   GET    /watchlist?email=               → { items: WatchlistItem[] }
//   DELETE /watchlist/{id}?email=          → { deleted, id }
//   GET    /watchlist/alerts?email=        → { alerts: WatchAlert[] } newest first
//   POST   /watchlist/{id}/alerts/seen     → { updated }

export interface WatchlistItem {
  id: string;
  district: string;
  taluka: string;
  village: string;
  survey_no: string;
  record_type?: string | null;
  last_checked_at?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface WatchAlertChange {
  old?: string | null;
  new?: string | null;
}

export interface WatchAlert {
  id: string;
  watchlist_id: string;
  changes: Record<string, WatchAlertChange>;
  seen: boolean;
  created_at: string;
  district?: string;
  taluka?: string;
  village?: string;
  survey_no?: string;
  [key: string]: unknown;
}

export interface AddWatchParams {
  email: string;
  district: string;
  taluka: string;
  village: string;
  survey_no: string;
  record_type?: string;
}

export async function addToWatchlist(params: AddWatchParams): Promise<WatchlistItem> {
  const res = await fetch(`${API_BASE_URL}/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...demoHeaders() },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({} as { detail?: unknown }));
    const detail =
      typeof errBody.detail === "string"
        ? errBody.detail
        : `Could not add to watchlist (HTTP ${res.status}).`;
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as WatchlistItem;
}

export async function fetchWatchlist(email: string): Promise<WatchlistItem[]> {
  const res = await fetch(`${API_BASE_URL}/watchlist?email=${encodeURIComponent(email)}`, {
    headers: demoHeaders(),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({} as { detail?: unknown }));
    const detail =
      typeof errBody.detail === "string"
        ? errBody.detail
        : `Could not load watchlist (HTTP ${res.status}).`;
    throw new ApiError(res.status, detail);
  }
  const data = await res.json();
  return Array.isArray(data.items) ? (data.items as WatchlistItem[]) : [];
}

export async function removeFromWatchlist(
  id: string,
  email: string
): Promise<{ deleted: boolean; id: string }> {
  const res = await fetch(
    `${API_BASE_URL}/watchlist/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}`,
    { method: "DELETE", headers: demoHeaders() }
  );
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({} as { detail?: unknown }));
    const detail =
      typeof errBody.detail === "string"
        ? errBody.detail
        : `Could not remove from watchlist (HTTP ${res.status}).`;
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as { deleted: boolean; id: string };
}

export async function fetchWatchlistAlerts(email: string): Promise<WatchAlert[]> {
  const res = await fetch(`${API_BASE_URL}/watchlist/alerts?email=${encodeURIComponent(email)}`, {
    headers: demoHeaders(),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({} as { detail?: unknown }));
    const detail =
      typeof errBody.detail === "string"
        ? errBody.detail
        : `Could not load alerts (HTTP ${res.status}).`;
    throw new ApiError(res.status, detail);
  }
  const data = await res.json();
  return Array.isArray(data.alerts) ? (data.alerts as WatchAlert[]) : [];
}

export async function markWatchAlertsSeen(watchlistId: string): Promise<{ updated: number }> {
  const res = await fetch(
    `${API_BASE_URL}/watchlist/${encodeURIComponent(watchlistId)}/alerts/seen`,
    { method: "POST", headers: demoHeaders() }
  );
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({} as { detail?: unknown }));
    const detail =
      typeof errBody.detail === "string"
        ? errBody.detail
        : `Could not mark alerts seen (HTTP ${res.status}).`;
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as { updated: number };
}

/** Count of unseen alerts — used for the TopNav badge. Fails silently (returns 0). */
export async function fetchUnseenAlertCount(email: string): Promise<number> {
  if (!email) return 0;
  try {
    const alerts = await fetchWatchlistAlerts(email);
    return alerts.filter((a) => !a.seen).length;
  } catch {
    return 0;
  }
}

// ─── Cached survey-number suggestions ───────────────────────────────────────
// Real survey numbers previously seen on AnyROR for a village (instant).

export async function fetchSurveyOptions(
  district: string, taluka: string, village: string
): Promise<string[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/options/surveys?district=${encodeURIComponent(district)}` +
      `&taluka=${encodeURIComponent(taluka)}&village=${encodeURIComponent(village)}`,
      { headers: demoHeaders() }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.surveys) ? data.surveys : [];
  } catch {
    return [];
  }
}
