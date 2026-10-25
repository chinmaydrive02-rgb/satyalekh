'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Download, Laptop, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { API_BASE_URL } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';
import { acquiredSource, acquisitionRequest, type RetrievalJob, type RetrievalWorker } from '@/lib/acquisition';

const inputClass = 'w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30';
const statusLabels = { queued: 'Waiting for your connected computer', running: 'Opening the official record', awaiting_captcha: 'Your answer is needed', completed: 'Record retrieved', failed: 'Retrieval could not finish' };

export default function RetrievePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [workers, setWorkers] = useState<RetrievalWorker[]>([]);
  const [workerId, setWorkerId] = useState('');
  const [code, setCode] = useState('');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');
  const [survey, setSurvey] = useState('');
  const [districts, setDistricts] = useState<string[]>([]);
  const [talukas, setTalukas] = useState<string[]>([]);
  const [villages, setVillages] = useState<Array<{ english: string; gujarati: string }>>([]);
  const [job, setJob] = useState<RetrievalJob | null>(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [submittedChallenge, setSubmittedChallenge] = useState('');
  const [error, setError] = useState('');
  const [pollError, setPollError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user?.email_confirmed_at))).catch(() => setSignedIn(false));
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user.email_confirmed_at)); setWorkers([]); setJob(null); setWorkerId('');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        const data = await acquisitionRequest<{ workers: RetrievalWorker[] }>('/workers', undefined, controller.signal);
        if (controller.signal.aborted) return;
        setWorkers(data.workers);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load connected computers.'); }
      if (!controller.signal.aborted) timer = setTimeout(refresh, 10000);
    };
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [signedIn]);

  const activeWorker = workers.find(worker => worker.id === workerId && worker.online);
  const jobActive = Boolean(job && !['completed', 'failed'].includes(job.status));
  const challenge = job?.challenge_id && job.image_base64 ? { challenge_id: job.challenge_id, image_base64: job.image_base64, expires_at: job.challenge_expires_at, mime_type: job.image_base64.startsWith('/9j/') ? 'image/jpeg' : job.image_base64.startsWith('R0lGOD') ? 'image/gif' : 'image/png' } : undefined;
  useEffect(() => { setAnswer(''); setSubmittedChallenge(''); }, [challenge?.challenge_id]);

  useEffect(() => {
    if (!job?.id || !jobActive) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const current = await acquisitionRequest<RetrievalJob>(`/jobs/${job.id}`, undefined, controller.signal);
        if (controller.signal.aborted) return;
        setJob(current); setPollError('');
        if (['completed', 'failed'].includes(current.status)) return;
      } catch { if (!controller.signal.aborted) setPollError('Connection interrupted. Reconnecting to your retrieval…'); }
      if (!controller.signal.aborted) timer = setTimeout(poll, 2000);
    };
    timer = setTimeout(poll, 1000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [job?.id, jobActive]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/options/districts`, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Options unavailable'); return r.json(); }).then(d => { if (!controller.signal.aborted) setDistricts(d.districts || []); }).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setTalukas([]);
    if (district) fetch(`${API_BASE_URL}/options/talukas?district=${encodeURIComponent(district)}`, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Options unavailable'); return r.json(); }).then(d => { if (!controller.signal.aborted) setTalukas(d.talukas || []); }).catch(() => {});
    return () => controller.abort();
  }, [district]);
  useEffect(() => {
    const controller = new AbortController();
    setVillages([]);
    if (district && taluka) fetch(`${API_BASE_URL}/options/villages?district=${encodeURIComponent(district)}&taluka=${encodeURIComponent(taluka)}`, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Options unavailable'); return r.json(); }).then(d => { if (!controller.signal.aborted) setVillages(d.villages || []); }).catch(() => {});
    return () => controller.abort();
  }, [district, taluka]);

  async function connect(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await acquisitionRequest('/workers/connect', { pairing_code: code.trim().toUpperCase() });
      const data = await acquisitionRequest<{ workers: RetrievalWorker[] }>('/workers');
      setWorkers(data.workers); setCode(''); setNotice('Computer connected. Select it below to retrieve a record.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not connect the computer.'); }
    finally { setBusy(false); }
  }
  async function retrieve(event: React.FormEvent) {
    event.preventDefault(); if (!activeWorker || jobActive) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const created = await acquisitionRequest<RetrievalJob>('/jobs', { worker_id: workerId, district: district.trim(), taluka: taluka.trim(), village: village.trim(), survey_no: survey.trim(), record_type: 'VF7' });
      setJob(created);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not start retrieval.'); }
    finally { setBusy(false); }
  }
  async function submitAnswer(event: React.FormEvent) {
    event.preventDefault(); if (!job || !challenge || submittedChallenge === challenge.challenge_id) return;
    setBusy(true); setError('');
    const challengeId = challenge.challenge_id;
    try {
      await acquisitionRequest(`/jobs/${job.id}/answer`, { challenge_id: challengeId, answer: answer.trim() });
      setSubmittedChallenge(challengeId); setAnswer('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not submit your answer.'); }
    finally { setBusy(false); }
  }
  async function downloadSource() {
    if (!job) return;
    setBusy(true); setError('');
    try {
      const file = await acquiredSource(job.id); const url = URL.createObjectURL(file);
      const link = document.createElement('a'); link.href = url; link.download = file.name; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not download source.'); }
    finally { setBusy(false); }
  }
  const source = job?.result?.source_record;
  return <div className="min-h-screen bg-bg text-ink pt-28 pb-16 px-4 sm:px-6"><TopNav />
    <main className="max-w-4xl mx-auto space-y-6">
      <header className="max-w-2xl space-y-3"><p className="eyebrow">Official record retrieval · VF-7</p><h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">From the portal.<br /><span className="text-brand">Into your workspace.</span></h1><p className="text-muted leading-relaxed">Choose a parcel here. Your connected computer retrieves it from AnyROR, and you answer the portal’s CAPTCHA here when it appears.</p></header>
      {error && <p role="alert" className="rounded-xl border border-danger-border bg-danger-soft p-4 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="card p-4 text-sm">{notice}</p>}
      {signedIn === null ? <p role="status" className="flex gap-2"><Loader2 className="animate-spin" size={18} /> Checking your account…</p> : !signedIn ? <section className="card p-6 space-y-3"><h2 className="text-xl font-semibold">Your private retrieval workspace</h2><p className="text-sm text-muted">Sign in with a confirmed email to connect a computer and keep each request linked to your account.</p><Link href="/account" className="btn btn-primary inline-flex gap-2">Sign in <ArrowRight size={16} /></Link></section> : <>
      <section className="card p-5 sm:p-7 space-y-5"><div className="flex gap-3"><Laptop className="text-brand shrink-0" /><div><h2 className="text-lg font-semibold">Connected computer</h2><p className="text-sm text-muted mt-1">Keep the Satyalekh connector running on a computer that can open AnyROR. No inbound port or paid hosting is needed.</p></div></div>
        {workers.length ? <div className="space-y-2">{workers.map(worker => <div key={worker.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"><label className="flex-1 flex gap-3 items-center text-sm"><input type="radio" name="worker" checked={workerId === worker.id} disabled={!worker.online || jobActive} onChange={() => setWorkerId(worker.id)} /><span>{worker.name || `Retrieval computer · ${worker.id.slice(-6)}`}<span className={`block text-xs mt-1 ${worker.online ? 'text-brand' : 'text-muted'}`}>{worker.online ? 'Online' : 'Offline · start its connector'}</span></span></label><button disabled={busy || jobActive} className="text-xs text-muted underline disabled:opacity-50" onClick={async () => { setBusy(true); try { await acquisitionRequest(`/workers/${worker.id}/disconnect`, {}); setWorkers(previous => previous.filter(item => item.id !== worker.id)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not disconnect.'); } finally { setBusy(false); } }}>Disconnect</button></div>)}</div> : <p className="rounded-xl bg-surface-soft p-4 text-sm">No computer connected yet. Start the local connector, then enter the pairing code it displays. Retrieval becomes available while that connector is online. <Link href="/retrieve/connector" className="block text-brand underline mt-2">Set up the free connector</Link></p>}
        <form onSubmit={connect} className="flex flex-col sm:flex-row gap-2"><label className="flex-1"><span className="sr-only">Pairing code from your connector</span><input className={inputClass} required maxLength={12} autoComplete="off" placeholder="Pairing code from your connector" value={code} onChange={e => setCode(e.target.value)} /></label><button className="btn btn-outline" disabled={busy || !code.trim()}>Connect this computer</button></form>
        <Link href="/retrieve/connector" className="inline-block text-sm text-brand underline">Connector download and setup instructions</Link><p className="text-xs text-muted flex items-start gap-2"><ShieldCheck size={15} className="shrink-0" />Pairing permits new public parcel requests for your account. It does not grant access to private files, browser history or browser cookies.</p>
      </section>
      <form onSubmit={retrieve} className="card p-5 sm:p-7 space-y-5"><div><h2 className="text-lg font-semibold">Select a parcel</h2><p className="text-sm text-muted mt-1">VF-7 survey details. Enter exact official names; Gujarati village names are supported.</p></div><fieldset disabled={jobActive || busy} className="grid sm:grid-cols-2 gap-4 disabled:opacity-60">
        <label className="text-sm space-y-2"><span>District</span><input required list="retrieval-districts" className={inputClass} value={district} onChange={e => { setDistrict(e.target.value); setTaluka(''); setVillage(''); }} maxLength={150} /><datalist id="retrieval-districts">{districts.map(item => <option key={item} value={item} />)}</datalist></label>
        <label className="text-sm space-y-2"><span>Taluka</span><input required list="retrieval-talukas" className={inputClass} value={taluka} onChange={e => { setTaluka(e.target.value); setVillage(''); }} maxLength={150} /><datalist id="retrieval-talukas">{talukas.map(item => <option key={item} value={item} />)}</datalist></label>
        <label className="text-sm space-y-2"><span>Village · official name</span><input required list="retrieval-villages" className={inputClass} value={village} onChange={e => setVillage(e.target.value)} maxLength={150} /><datalist id="retrieval-villages">{villages.map(item => <option key={item.gujarati} value={item.gujarati}>{item.english}</option>)}</datalist><span className="block text-xs text-muted">If suggestions are unavailable, type the exact name from AnyROR.</span></label>
        <label className="text-sm space-y-2"><span>Survey / block number</span><input required className={inputClass} value={survey} onChange={e => setSurvey(e.target.value)} maxLength={64} /></label>
      </fieldset><div className="flex flex-wrap items-center gap-3"><button className="btn btn-primary flex gap-2 items-center" disabled={busy || jobActive || !activeWorker}>{busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}Retrieve VF-7</button><button type="button" disabled={busy || jobActive} className="text-sm text-brand underline" onClick={() => { setDistrict('Gandhinagar'); setTaluka('Kalol'); setVillage('અઢાણા - 039'); setSurvey('3'); }}>Use public sample parcel</button></div><p className="text-xs text-muted">The sample shortcut performs a real lookup; it does not load demonstration data. <Link href="/upload" className="underline">Other record types and document scanning</Link></p></form>
      {job && <section className="card p-5 sm:p-7 space-y-5" aria-live="polite"><div className="flex items-center gap-3">{job.status === 'completed' ? <CheckCircle2 className="text-brand" /> : jobActive ? <Loader2 className="animate-spin text-brand" /> : <RefreshCw className="text-muted" />}<h2 className="text-lg font-semibold">{statusLabels[job.status]}</h2></div>{pollError && <p className="text-sm text-muted">{pollError}</p>}{(job.error || job.failure_code) && <p role="alert" className="text-sm text-danger">{job.error || `Retrieval stopped: ${job.failure_code?.replaceAll('_', ' ')}. Please try a new request.`}</p>}
      {job.status === 'awaiting_captcha' && challenge && <form key={challenge.challenge_id} onSubmit={submitAnswer} className="space-y-4 max-w-sm"><p className="text-sm text-muted">AnyROR asks you to read this image. Your answer is used once for this parcel request.</p>{/^(?:image\/png|image\/jpeg|image\/webp|image\/gif)$/.test(challenge.mime_type || 'image/png') && /^[a-zA-Z0-9+/=\r\n]+$/.test(challenge.image_base64) && <img src={`data:${challenge.mime_type || 'image/png'};base64,${challenge.image_base64}`} alt="AnyROR CAPTCHA challenge; type the characters visible in this image" className="max-w-full rounded-lg border border-border bg-white p-3" />}<label className="block text-sm space-y-2"><span>Characters in the image</span><input required autoComplete="off" autoCapitalize="off" spellCheck={false} pattern="[A-Za-z0-9]+" maxLength={12} className={inputClass} value={answer} onChange={e => setAnswer(e.target.value)} disabled={busy || submittedChallenge === challenge.challenge_id} /></label><button className="btn btn-primary" disabled={busy || submittedChallenge === challenge.challenge_id}>{submittedChallenge === challenge.challenge_id ? 'Answer sent · awaiting AnyROR' : 'Submit answer'}</button><p className="text-xs text-muted">{challenge.expires_at ? `Challenge expires at ${new Date(challenge.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ` : ''}If it expires, start a new retrieval. Previous answers cannot be reused.</p></form>}
      {job.status === 'completed' && source && <div className="space-y-6"><div className="rounded-xl bg-surface-soft p-4 text-sm"><p className="font-medium">Retrieved source · review required</p><p className="text-muted mt-1">This informational VF-7 is the start of the dossier. Supporting mutations, deeds and other title evidence remain outstanding. The ownership chain is incomplete.</p></div><dl className="grid sm:grid-cols-2 gap-4 text-sm">{Object.entries({ ...source.locations, ...source.identifiers, 'Source as of': source.source_as_of || 'Not supplied', ...job.result?.acquisition }).map(([key, value]) => <div key={key}><dt className="text-xs text-muted capitalize">{key.replaceAll('_', ' ')}</dt><dd className="break-words mt-1">{String(value)}</dd></div>)}</dl>{[{ title: 'All recorded holders', rows: source.owners }, { title: 'Rights and other interests', rows: source.rights }].map(group => <div key={group.title}><h3 className="font-semibold text-sm">{group.title} ({group.rows?.length || 0})</h3><ul className="mt-3 space-y-2">{group.rows?.map((row, index) => <li key={index} className="text-sm whitespace-pre-wrap break-words rounded-lg border border-border p-3">{row}</li>)}</ul></div>)}{Boolean(job.result?.report?.coverage?.unresolved_mutation_references?.length) && <div><h3 className="font-semibold text-sm">Supporting VF-6 entries still required</h3><p className="text-sm text-muted mt-2 break-words">{job.result?.report?.coverage?.unresolved_mutation_references?.join(', ')}</p></div>}<p className="text-xs text-muted break-all">Source SHA-256 · {job.result?.report?.source_document?.sha256 || job.result?.metadata?.source_sha256 || 'Not supplied'}</p><div className="flex flex-wrap gap-3"><Link href={`/upload?acquisition_job=${encodeURIComponent(job.id)}`} className="btn btn-primary inline-flex gap-2 items-center">Review and save <ArrowRight size={16} /></Link><button onClick={downloadSource} disabled={busy} className="btn btn-outline inline-flex gap-2 items-center"><Download size={16} />Original source</button></div><p className="text-xs text-muted">The review workspace loads this record directly. No manual download and upload is required.</p></div>}
      </section>}
      </>}
    </main>
  </div>;
}
