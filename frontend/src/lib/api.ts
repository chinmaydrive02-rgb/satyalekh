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
