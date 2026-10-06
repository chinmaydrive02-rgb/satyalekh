'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import TitleReportView from '@/components/TitleReport';
import { createClient } from '@/utils/supabase/client';
import { fetchSavedReport, SavedReport } from '@/lib/api';

export default function SavedReportPage() {
  const { id } = useParams<{ id: string }>();
  return <SavedReportContent key={id} id={id}/>;
}

function SavedReportContent({ id }: { id: string }) {
  const supabase = createClient();
  const [accountId, setAccountId] = useState<string | null>();
  const identityRef = useRef<string | null | undefined>(undefined);
  const requestRef = useRef<AbortController | null>(null);
  const [saved, setSaved] = useState<SavedReport | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user.email_confirmed_at ? session.user.id : null;
      if (identityRef.current !== nextId) {
        identityRef.current = nextId; requestRef.current?.abort();
        setSaved(null); setError(''); setBusy(Boolean(nextId)); setAccountId(nextId);
      }
    });
    return () => { data.subscription.unsubscribe(); requestRef.current?.abort(); };
  }, [supabase.auth]);

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController(); requestRef.current = controller;
    fetchSavedReport(id, accountId, controller.signal).then(data => {
      if (!controller.signal.aborted && identityRef.current === accountId) setSaved(data);
    }).catch(error => {
      if (!controller.signal.aborted && identityRef.current === accountId) setError(error instanceof Error ? error.message : 'Could not load this report.');
    }).finally(() => {
      if (!controller.signal.aborted && identityRef.current === accountId) setBusy(false);
    });
    return () => controller.abort();
  }, [accountId, id, retry]);

  return <main className="min-h-screen bg-bg text-ink pt-28 pb-16 px-4 sm:px-6"><TopNav/><div className="max-w-4xl mx-auto space-y-6">
    <div className="print:hidden"><Link href="/reports" className="text-sm text-brand underline">All saved reports</Link><h1 className="text-3xl font-semibold mt-3">Saved report</h1><p className="text-sm text-muted mt-2">This is your saved reviewed snapshot. Source authenticity and complete title history remain unverified.</p></div>
    {accountId === null ? <p className="card p-6 text-sm">Sign in with a confirmed email to open this report. <Link href="/account" className="text-brand underline">Sign in</Link></p> : busy ? <p role="status" className="text-sm text-muted">Loading your report…</p> : error ? <div className="card p-6"><p role="alert" className="text-sm text-danger">{error}</p><button onClick={() => { setBusy(true); setError(''); setRetry(value => value + 1); }} className="btn btn-outline mt-3">Try again</button></div> : saved && saved.id === id ? <><div className="flex flex-wrap gap-3 items-center print:hidden"><p className="text-xs text-muted">Saved {new Date(saved.created_at).toLocaleString('en-IN')}</p><button type="button" onClick={() => window.print()} className="btn btn-outline">Print / save PDF</button></div>{saved.report.source_review_metadata && <section className="card p-5 space-y-3 break-words"><h2 className="font-semibold">Saved source review</h2><p className="text-xs text-muted">Reader: {saved.report.source_review_metadata.reader || 'not recorded'} · Pages read: {saved.report.source_review_metadata.pages_processed ?? 'not recorded'} of {saved.report.source_review_metadata.pages_total ?? 'not recorded'}. User confirmation does not establish source authenticity.</p>{saved.report.source_review_metadata.warnings?.map((warning, index) => <p key={index} className="text-sm text-warning">{warning}</p>)}{saved.report.source_review_metadata.review_changes?.length ? <ul className="space-y-3">{saved.report.source_review_metadata.review_changes.map((change, index) => <li key={index} className="text-sm"><p className="font-medium">{change.field.replaceAll('_', ' ')}</p><p className="text-muted whitespace-pre-wrap">Machine reading: {change.machine_value}</p><p className="whitespace-pre-wrap">Reviewed value: {change.reviewed_value}</p></li>)}</ul> : <p className="text-xs text-muted">No field changes recorded.</p>}</section>}<TitleReportView report={saved.report}/></> : null}
  </div></main>;
}
