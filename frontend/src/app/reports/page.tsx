'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import { createClient } from '@/utils/supabase/client';
import { fetchSavedReports, SavedReportSummary } from '@/lib/api';

export default function ReportsPage() {
  const supabase = createClient();
  const [accountId, setAccountId] = useState<string | null>();
  const identityRef = useRef<string | null | undefined>(undefined);
  const requestRef = useRef<AbortController | null>(null);
  const [reports, setReports] = useState<SavedReportSummary[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.email_confirmed_at ? session.user.id : null;
      if (identityRef.current !== id) {
        identityRef.current = id; requestRef.current?.abort();
        setReports([]); setOffset(0); setError(''); setBusy(Boolean(id)); setAccountId(id);
      }
    });
    return () => { data.subscription.unsubscribe(); requestRef.current?.abort(); };
  }, [supabase.auth]);

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController(); requestRef.current = controller;
    fetchSavedReports(accountId, controller.signal, offset).then(data => {
      if (!controller.signal.aborted && identityRef.current === accountId) setReports(data.reports);
    }).catch(error => {
      if (!controller.signal.aborted && identityRef.current === accountId) setError(error instanceof Error ? error.message : 'Could not load your reports.');
    }).finally(() => {
      if (!controller.signal.aborted && identityRef.current === accountId) setBusy(false);
    });
    return () => controller.abort();
  }, [accountId, retry, offset]);

  return <main className="min-h-screen bg-bg text-ink pt-28 pb-16 px-4 sm:px-6"><TopNav/><div className="max-w-3xl mx-auto space-y-6">
    <div><p className="eyebrow">Private workspace</p><h1 className="text-3xl font-semibold mt-2">Saved reports</h1><p className="text-sm text-muted mt-3">Reopen the reviewed reports saved to your account. These are saved snapshots; opening them does not retrieve fresh government records.</p></div>
    <div className="flex flex-wrap gap-3"><Link href="/upload" className="btn btn-primary">Review a land record</Link><Link href="/account" className="btn btn-outline">Account</Link></div>
    {accountId === null ? <p className="card p-6 text-sm">Sign in with a confirmed email to see your reports. <Link href="/account" className="text-brand underline">Sign in</Link></p> : busy ? <p role="status" className="text-sm text-muted">Loading your reports…</p> : error ? <div className="card p-6"><p role="alert" className="text-sm text-danger">{error}</p><button onClick={() => { setBusy(true); setError(''); setRetry(value => value + 1); }} className="btn btn-outline mt-3">Try again</button></div> : reports.length === 0 ? <p className="card p-6 text-sm text-muted">{offset ? 'No more saved reports on this page.' : 'No saved reports yet. After reviewing a record, choose “Save report to my account”.'}</p> : <ul className="space-y-3">{reports.map(report => <li key={report.id} className="card p-5"><Link href={`/reports/${encodeURIComponent(report.id)}`} className="text-brand font-semibold underline break-words">Survey {report.survey_no || 'not supplied'} · {report.record_type || 'Reviewed record'}</Link><p className="text-sm text-muted mt-2 break-words">{[report.village, report.taluka, report.district].filter(Boolean).join(', ') || 'Location not supplied'}</p><p className="text-xs text-muted mt-2">Saved {new Date(report.created_at).toLocaleString('en-IN')}</p></li>)}</ul>}
    {accountId && !busy && !error && <nav aria-label="Report pages" className="flex flex-wrap items-center gap-3"><button type="button" disabled={offset === 0} onClick={() => { requestRef.current?.abort(); setReports([]); setBusy(true); setOffset(value => Math.max(0, value - 30)); }} className="btn btn-outline disabled:opacity-40">Newer reports</button><span className="text-xs text-muted">Page {Math.floor(offset / 30) + 1}</span><button type="button" disabled={reports.length < 30 || offset + 30 > 10000} onClick={() => { requestRef.current?.abort(); setReports([]); setBusy(true); setOffset(value => value + 30); }} className="btn btn-outline disabled:opacity-40">Older reports</button></nav>}
  </div></main>;
}
