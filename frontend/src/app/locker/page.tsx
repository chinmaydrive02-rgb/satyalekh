"use client";

// Property Locker — secure-vault style document hosting (Landeed parity).
// Documents are stored in Supabase storage under unguessable per-user paths
// and indexed by email (matches the app's current email-keyed account model).

import React, { useState, useEffect, useCallback, useRef } from 'react';
import TopNav from '@/components/TopNav';
import { Reveal } from '@/components/motion';
import { createClient } from '@/utils/supabase/client';
import { getUserEmail, setUserEmail } from '@/lib/api';
import { Vault, UploadCloud, FileText, Trash2, Download, Loader2, Mail, ShieldCheck } from 'lucide-react';

const DOC_TYPES = ['7/12 Extract', 'VF-6 / Mutation', 'Index-2 / Sale Deed', 'NA Order', 'EC', 'Property Tax', 'Approved Plan', 'Other'];
const MAX_MB = 15;

interface Doc { id: string; file_name: string; storage_path: string; doc_type: string; size_bytes: number; created_at: string; }

function pathKey(email: string): string {
  // Stable unguessable prefix per email (not security-grade — beta model)
  let h = 0x811c9dc5;
  for (let i = 0; i < email.length; i++) { h ^= email.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36) + email.length.toString(36);
}

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

  useEffect(() => {
    const saved = getUserEmail();
    if (saved) { setEmail(saved); setEntered(true); }
  }, []);

  const load = useCallback(async (em: string) => {
    setBusy(true);
    const { data, error: e } = await supabase.from('locker_documents')
      .select('*').eq('user_email', em).order('created_at', { ascending: false });
    setBusy(false);
    if (e) { setError('Could not load locker — run the latest schema.sql in Supabase.'); return; }
    setDocs((data || []) as Doc[]);
  }, [supabase]);

  useEffect(() => { if (entered && email) load(email); }, [entered, email, load]);

  const onUpload = async (f: File) => {
    setError('');
    if (f.size > MAX_MB * 1024 * 1024) { setError(`File too large — max ${MAX_MB} MB.`); return; }
    setUploading(true);
    try {
      const path = `${pathKey(email)}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('lockers').upload(path, f);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from('locker_documents').insert({
        user_email: email, file_name: f.name, storage_path: path, doc_type: docType, size_bytes: f.size,
      });
      if (insErr) throw insErr;
      await load(email);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // SECURITY F-04: short-lived signed URLs instead of permanent public URLs.
  // Works whether the bucket is public or private, so the owner can flip the
  // 'lockers' bucket to private (see SECURITY_TODO.md) with no code change.
  const download = async (d: Doc) => {
    const { data } = await supabase.storage.from('lockers').createSignedUrl(d.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const remove = async (d: Doc) => {
    if (!confirm(`Delete "${d.file_name}" from your locker?`)) return;
    await supabase.storage.from('lockers').remove([d.storage_path]);
    await supabase.from('locker_documents').delete().eq('id', d.id);
    await load(email);
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

        {!entered ? (
          <form
            className="sl-anim card p-8 flex flex-col gap-4 max-w-md"
            style={{ animation: 'sl-fade-up 0.5s cubic-bezier(0.22,0.61,0.36,1) 0.1s both' }}
            onSubmit={e => { e.preventDefault(); const em = email.trim().toLowerCase(); if (!em.includes('@')) return; setUserEmail(em); setEmail(em); setEntered(true); }}>
            <p className="text-sm text-muted leading-relaxed">Your locker is linked to your email — the same one used for search credits.</p>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
              className="input" />
            <button type="submit" className="btn btn-primary">
              <Mail size={14}/> Open My Locker
            </button>
          </form>
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
              Documents are stored under private, unguessable paths linked to your email. Account-level
              encryption and sharing controls arrive with full accounts — avoid uploading Aadhaar or
              other identity documents during beta.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
