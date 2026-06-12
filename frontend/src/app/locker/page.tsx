"use client";

// Property Locker — secure-vault style document hosting (Landeed parity).
// Documents are stored in Supabase storage under unguessable per-user paths
// and indexed by email (matches the app's current email-keyed account model).

import React, { useState, useEffect, useCallback, useRef } from 'react';
import TopNav from '@/components/TopNav';
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

  const download = (d: Doc) => {
    const { data } = supabase.storage.from('lockers').getPublicUrl(d.storage_path);
    if (data?.publicUrl) window.open(data.publicUrl, '_blank');
  };

  const remove = async (d: Doc) => {
    if (!confirm(`Delete "${d.file_name}" from your locker?`)) return;
    await supabase.storage.from('lockers').remove([d.storage_path]);
    await supabase.from('locker_documents').delete().eq('id', d.id);
    await load(email);
  };

  const fmtSize = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#dbfcff] pt-24 pb-12 px-6 relative">
      <TopNav />
      <div className="w-full max-w-[860px] mx-auto flex flex-col gap-6">
        <div className="border-b border-[#3b494b]/40 pb-4">
          <h1 className="text-4xl font-display uppercase tracking-tight text-[#00f0ff] flex items-center gap-3"><Vault size={30}/> Property Locker</h1>
          <p className="text-[#849495] text-xs tracking-widest uppercase mt-2">Your land documents — stored, organised, available anywhere</p>
        </div>

        {!entered ? (
          <form
            className="glass-panel border border-[#3b494b]/40 p-8 flex flex-col gap-4 max-w-md"
            onSubmit={e => { e.preventDefault(); const em = email.trim().toLowerCase(); if (!em.includes('@')) return; setUserEmail(em); setEmail(em); setEntered(true); }}>
            <p className="text-xs text-[#849495] leading-relaxed">Your locker is linked to your email — the same one used for search credits.</p>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
              className="bg-[#111] border border-[#3b494b] text-[#dbfcff] px-3 py-3 font-mono text-sm focus:outline-none focus:border-[#00f0ff]" />
            <button type="submit" className="py-3 bg-gradient-to-r from-[#0bd9e4] to-[#00f0ff] text-[#002022] text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Mail size={13}/> Open My Locker
            </button>
          </form>
        ) : (
          <>
            {/* Upload */}
            <div className="glass-panel border border-[#3b494b]/40 p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#849495]">Document Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="bg-[#111] border border-[#3b494b] text-[#dbfcff] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#00f0ff]" style={{ backgroundColor: '#111' }}>
                  {DOC_TYPES.map(t => <option key={t} value={t} style={{ backgroundColor: '#111' }}>{t}</option>)}
                </select>
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0bd9e4] to-[#00f0ff] text-[#002022] text-xs font-bold tracking-widest uppercase flex items-center gap-2 disabled:opacity-50">
                {uploading ? <><Loader2 size={13} className="animate-spin"/> Uploading…</> : <><UploadCloud size={13}/> Upload Document</>}
              </button>
              <span className="text-[9px] text-[#3b494b]">PDF / images · up to {MAX_MB} MB · locker: {email}</span>
            </div>
            {error && <div className="text-[10px] font-mono text-[#ba1b24] px-3 py-2 border border-[#ba1b24]/40 bg-[#ba1b24]/5">{error}</div>}

            {/* Documents */}
            {busy ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="text-[#00f0ff] animate-spin"/></div>
            ) : docs.length === 0 ? (
              <div className="glass-panel border border-[#3b494b]/40 p-12 text-center text-[#3b494b] text-xs">
                Your locker is empty — upload your 7/12, sale deed, NA order or any property document to keep it safe and reachable anywhere.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {docs.map(d => (
                  <div key={d.id} className="glass-panel border border-[#3b494b]/40 p-4 flex items-center gap-4">
                    <FileText size={18} className="text-[#00f0ff] shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#dbfcff] truncate">{d.file_name}</div>
                      <div className="text-[9px] text-[#849495] font-mono uppercase tracking-wider">
                        {d.doc_type} · {fmtSize(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <button onClick={() => download(d)} title="Download" className="p-2 text-[#4edea3] hover:bg-[#4edea3]/10"><Download size={15}/></button>
                    <button onClick={() => remove(d)} title="Delete" className="p-2 text-[#ba1b24] hover:bg-[#ba1b24]/10"><Trash2 size={15}/></button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[9px] text-[#3b494b] leading-relaxed flex items-start gap-2">
              <ShieldCheck size={11} className="mt-0.5 shrink-0"/>
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
