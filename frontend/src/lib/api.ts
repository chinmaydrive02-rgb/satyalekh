// Central API configuration
// Uses NEXT_PUBLIC_API_URL from .env.local (defaults to localhost:8000 for dev)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://satyalekh-api.onrender.com";

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

// ─── Cached survey-number suggestions ───────────────────────────────────────
// Real survey numbers previously seen on AnyROR for a village (instant).

export async function fetchSurveyOptions(
  district: string, taluka: string, village: string
): Promise<string[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/options/surveys?district=${encodeURIComponent(district)}` +
      `&taluka=${encodeURIComponent(taluka)}&village=${encodeURIComponent(village)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.surveys) ? data.surveys : [];
  } catch {
    return [];
  }
}
