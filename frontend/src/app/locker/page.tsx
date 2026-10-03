"use client";

// Property Locker — secure-vault style document hosting (Landeed parity).
// Documents use authenticated account ownership and UUID-scoped storage paths.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AccountGate from '@/components/AccountGate';
import { requireUser } from '@/lib/auth';
import TopNav from '@/components/TopNav';
import { Reveal } from '@/components/motion';
import { createClient } from '@/utils/supabase/client';
import { getUserEmail, isDemoActive, DEMO_EMAIL } from '@/lib/api';
import { Vault, UploadCloud, FileText, Trash2, Download, Loader2, ShieldCheck, FlaskConical } from 'lucide-react';

const DOC_TYPES = ['7/12 Extract', 'VF-6 / Mutation', 'Index-2 / Sale Deed', 'NA Order', 'EC', 'Property Tax', 'Approved Plan', 'Other'];
const MAX_MB = 15;

interface Doc { id: string; file_name: string; storage_path: string; doc_type: string; size_bytes: number; created_at: string; }

// ── DEMO MODE ── seeded locker documents (client-side; never touches Supabase).
const DEMO_DOCS: Doc[] = [
  { id: 'demo-1', file_name: '7-12_Navrangpura_Survey_128P.pdf', storage_path: 'demo', doc_type: '7/12 Extract',       size_bytes: 412000,  created_at: '2026-05-02T09:12:00Z' },
  { id: 'demo-2', file_name: 'Sale_Deed_Index-2_128P.pdf',       storage_path: 'demo', doc_type: 'Index-2 / Sale Deed', size_bytes: 1840000, created_at: '2026-04-18T14:40:00Z' },
  { id: 'demo-3', file_name: 'NA_Order_Collector_Ahmedabad.pdf', storage_path: 'demo', doc_type: 'NA Order',            size_bytes: 690000,  created_at: '2026-03-27T11:05:00Z' },
  { id: 'demo-4', file_name: 'Encumbrance_Certificate_2015-25.pdf', storage_path: 'demo', doc_type: 'EC',               size_bytes: 305000,  created_at: '2026-03-10T16:22:00Z' },
  { id: 'demo-5', file_name: 'VF-6_Mutation_Entries_128P.pdf',   storage_path: 'demo', doc_type: 'VF-6 / Mutation',     size_bytes: 528000,  created_at: '2026-02-20T08:48:00Z' },
  { id: 'demo-6', file_name: 'Property_Tax_Receipt_AMC.pdf',     storage_path: 'demo', doc_type: 'Property Tax',        size_bytes: 142000,  created_at: '2026-01-31T10:15:00Z' },
];

export default function Locker() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [entered, setEntered] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [demoActive, setDemoActive] = useState(false);

  useEffect(() => {
    // ── DEMO MODE ── skip the email gate, show a seeded locker.
    if (isDemoActive()) {
      setDemoActive(true);
      setEmail(getUserEmail() || DEMO_EMAIL);
      setDocs(DEMO_DOCS);
      setEntered(true);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email_confirmed_at) { setEmail(data.user.email || ''); setEntered(true); }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setEmail(user?.email || ''); setEntered(Boolean(user?.email_confirmed_at));
      if (!user) setDocs([]);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase.auth]);

  const load = useCallback(async () => {
    if (isDemoActive()) { setDocs(DEMO_DOCS); setBusy(false); return; }
    const { data: identity } = await supabase.auth.getUser();
    if (!identity.user?.email_confirmed_at) { setEntered(false); setDocs([]); return; }
    setBusy(true);
    const { data, error: e } = await supabase.from('locker_documents')
      .select('*').eq('owner_id', identity.user.id).order('created_at', { ascending: false });
    setBusy(false);
    if (e) { setError('Could not load your locker. Please try again.'); return; }
    const { data: current } = await supabase.auth.getSession();
    if (current.session?.user.id !== identity.user.id) return;
    setDocs((data || []) as Doc[]);
  }, [supabase]);

  useEffect(() => { if (entered && email) load(); }, [entered, email, load]);

  const onUpload = async (f: File) => {
    setError('');
    if (isDemoActive()) {
      // Demo: don't touch Supabase — just prepend a friendly seeded row.
      setDocs(prev => [{
        id: `demo-${crypto.randomUUID()}`,
        file_name: f.name,
        storage_path: 'demo',
        doc_type: docType,
        size_bytes: f.size,
        created_at: new Date().toISOString(),
      }, ...prev]);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`File too large — max ${MAX_MB} MB.`); return; }
    setUploading(true);
    try {
      const user = await requireUser();
      const path = `${user.id}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('lockers').upload(path, f);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from('locker_documents').insert({
        owner_id: user.id, user_email: user.email, file_name: f.name, storage_path: path, doc_type: docType, size_bytes: f.size,
      });
      if (insErr) { await supabase.storage.from('lockers').remove([path]); throw insErr; }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // SECURITY F-04: short-lived signed URLs instead of permanent public URLs.
  // Works whether the bucket is public or private, so the owner can flip the
  // 'lockers' bucket to private (see SECURITY_TODO.md) with no code change.
  const download = async (d: Doc) => {
    if (isDemoActive()) {
      setError(`"${d.file_name}" is a sample document — downloads are disabled in the demo. In the live product this opens a short-lived signed link to your stored file.`);
      setTimeout(() => setError(''), 4000);
      return;
    }
    await requireUser();
    const { data, error: downloadError } = await supabase.storage.from('lockers').createSignedUrl(d.storage_path, 60);
    if (downloadError) { setError('Could not open this document. Please try again.'); return; }
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const remove = async (d: Doc) => {
    if (!confirm(`Delete "${d.file_name}" from your locker?`)) return;
    if (isDemoActive()) { setDocs(prev => prev.filter(x => x.id !== d.id)); return; }
    const user = await requireUser();
    const { error: removeError } = await supabase.storage.from('lockers').remove([d.storage_path]);
    if (removeError) { setError('Could not delete this document. Please try again.'); return; }
    const { error: metadataError } = await supabase.from('locker_documents').delete().eq('id', d.id).eq('owner_id', user.id);
    if (metadataError) { setError('The file was deleted but its listing could not be updated. Please refresh.'); return; }
    await load();
  };

  const fmtSize = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`;

  // Staggered entrance for document rows on first load only — uploads and
  // refreshes afterwards render instantly so nothing re-animates.
  const entranceDone = useRef(false);
  useEffect(() => {
    if (!busy && docs.length > 0) {
      const t = setTimeout(() => { entranceDone.current = true; }, 1400);
      return () => clearTimeout(t);
    }
  }, [busy, docs.length]);
  const rowAnim = (i: number): React.CSSProperties | undefined =>
    entranceDone.current
      ? undefined
      : { animation: `sl-slide-in 0.5s cubic-bezier(0.22,0.61,0.36,1) ${Math.min(i * 60, 480)}ms both` };

  return (
    <main className="min-h-screen bg-bg text-ink pt-24 pb-12 px-4 sm:px-6">
      <TopNav />
      <div className="w-full max-w-[860px] mx-auto flex flex-col gap-6">
        <Reveal>
          <div className="border-b border-border pb-6">
            <p className="eyebrow mb-1">Documents</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-ink flex items-center gap-3"><Vault size={28} className="text-brand"/> Property Locker</h1>
            <p className="text-muted text-sm mt-2">Your land documents — stored, organised, available anywhere.</p>
          </div>
        </Reveal>

        {demoActive && (
          <div className="text-sm text-warning bg-warning-soft border border-warning-border rounded-lg px-4 py-2.5 flex items-start gap-2">
            <FlaskConical size={14} className="mt-0.5 shrink-0" />
            <span>Demo locker — these are sample documents for a Navrangpura parcel. Uploads stay on-screen and downloads are disabled; nothing is saved.</span>
          </div>
        )}

        {!entered ? (
          <AccountGate feature="document locker"/>
        ) : (
          <>
            {/* Upload */}
            <div
              className="sl-anim card p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-end flex-wrap"
              style={{ animation: 'sl-fade-up 0.5s cubic-bezier(0.22,0.61,0.36,1) 0.08s both' }}
            >
              <div className="flex flex-col gap-1.5">
                <label className="label">Document Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="input cursor-pointer">
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="btn btn-primary">
                {uploading ? <><Loader2 size={14} className="animate-spin"/> Uploading…</> : <><UploadCloud size={14}/> Upload Document</>}
              </button>
              <span className="text-xs text-faint">PDF / images · up to {MAX_MB} MB · locker: {email}</span>
            </div>
            {error && <div className="text-sm text-danger px-3 py-2 rounded-lg border border-danger-border bg-danger-soft">{error}</div>}

            {/* Documents */}
            {busy ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="text-brand animate-spin"/></div>
            ) : docs.length === 0 ? (
              <div
                className="sl-anim card p-12 text-center text-muted text-sm"
                style={{ animation: 'sl-fade-up 0.5s cubic-bezier(0.22,0.61,0.36,1) both' }}
              >
                Your locker is empty — upload your 7/12, sale deed, NA order or any property document to keep it safe and reachable anywhere.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {docs.map((d, i) => (
                  <div key={d.id} className="sl-anim card card-lift p-4 flex items-center gap-4" style={rowAnim(i)}>
                    <FileText size={18} className="text-brand shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink font-medium truncate">{d.file_name}</div>
                      <div className="text-xs text-muted">
                        {d.doc_type} · {fmtSize(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <button onClick={() => download(d)} title="Download" className="p-2 rounded-lg text-success hover:bg-success-soft transition-colors"><Download size={15}/></button>
                    <button onClick={() => remove(d)} title="Delete" className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger-soft transition-colors"><Trash2 size={15}/></button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted leading-relaxed flex items-start gap-2">
              <ShieldCheck size={12} className="mt-0.5 shrink-0"/>
              Access is restricted to your signed-in account. Download links expire after 60 seconds.
              Documents saved before accounts were introduced are preserved and require a verified, administrator-assisted migration.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
