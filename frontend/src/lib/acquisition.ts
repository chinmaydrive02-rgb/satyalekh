import { API_BASE_URL, type SourceRecord, type TitleReport } from './api';
import { authorizationHeaders } from './auth';

export interface RetrievalWorker { id: string; name?: string; online: boolean; expires_at?: string; }
export interface AcquiredDraft {
  status: string;
  source_record?: SourceRecord;
  report?: TitleReport;
  acquisition?: Record<string, string | number | boolean>;
  metadata?: { source_sha256?: string; warnings?: string[] };
}
export interface RetrievalJob {
  id: string;
  status: 'queued' | 'running' | 'awaiting_captcha' | 'completed' | 'failed';
  error?: string;
  failure_code?: string;
  challenge_id?: string;
  image_base64?: string;
  challenge_expires_at?: string;
  result?: AcquiredDraft;
}
export async function acquisitionRequest<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/acquisition${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...await authorizationHeaders(), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body), signal, cache: 'no-store',
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(typeof payload.detail === 'string' ? payload.detail : `Retrieval request failed (${response.status}). Please try again.`);
  }
  return response.json();
}
export async function acquiredSource(jobId: string, signal?: AbortSignal): Promise<File> {
  if (!/^[a-zA-Z0-9-]{20,80}$/.test(jobId)) throw new Error('Invalid retrieval reference.');
  const response = await fetch(`${API_BASE_URL}/acquisition/jobs/${encodeURIComponent(jobId)}/source`, {
    headers: await authorizationHeaders(), signal, cache: 'no-store',
  });
  if (!response.ok) throw new Error('The acquired record is unavailable. Return to retrieval and check the job.');
  const blob = await response.blob();
  if (!blob.size || blob.size > 1024 * 1024) throw new Error('The acquired record exceeds the supported source size.');
  return new File([blob], `AnyROR-VF7-${jobId}.html`, { type: 'text/html' });
}
