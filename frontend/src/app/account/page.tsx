'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopNav from '@/components/TopNav';
import { createClient } from '@/utils/supabase/client';
import { exitDemo, setUserEmail } from '@/lib/api';
import { User } from '@supabase/supabase-js';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function AccountPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const credentials = { email: email.trim().toLowerCase(), password };
      const { data, error } = mode === 'signup'
        ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: `${window.location.origin}/account` } })
        : await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      if (data.session) {
        exitDemo(); setUserEmail(data.user?.email || credentials.email);
        setMessage('Signed in. Your private workspace is ready.');
      } else {
        setMessage('Check your email for a confirmation link, then return here to sign in. If no email arrives, contact support; email delivery may not yet be configured.');
      }
      setPassword('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-bg text-ink pt-28 pb-16 px-4"><TopNav/><div className="max-w-lg mx-auto card p-7 sm:p-10 space-y-6"><ShieldCheck className="text-brand" size={30}/><div><p className="eyebrow">Private workspace</p><h1 className="text-3xl font-semibold mt-2">Your Satyalekh account</h1><p className="text-muted text-sm mt-3">Keep your portfolio and property documents within your own account.</p></div>
    {user?.email_confirmed_at ? <div className="space-y-4"><p className="text-sm">Signed in as <strong>{user.email}</strong></p><div className="flex gap-3 flex-wrap"><Link className="btn btn-primary" href="/dashboard">Open portfolio</Link><Link className="btn btn-ghost" href="/locker">Open locker</Link></div><button className="btn btn-ghost" onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) setError(error.message); else { setUser(null); setUserEmail(''); setMessage('Signed out.'); } }}>Sign out</button></div> : <form onSubmit={submit} className="space-y-4"><div className="flex gap-2"><button type="button" onClick={() => setMode('signin')} className={`btn ${mode === 'signin' ? 'btn-primary' : 'btn-ghost'}`}>Sign in</button><button type="button" onClick={() => setMode('signup')} className={`btn ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`}>Create account</button></div><label className="block text-sm">Email<input className="input mt-2 w-full" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label className="block text-sm">Password<input className="input mt-2 w-full" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={e => setPassword(e.target.value)}/></label>{mode === 'signup' && <p className="text-xs text-muted">Use at least 8 characters. Confirm your email before opening your workspace.</p>}<button disabled={busy} className="btn btn-primary w-full">{busy ? <Loader2 size={16} className="animate-spin"/> : mode === 'signup' ? 'Create account' : 'Sign in'}</button></form>}
    {message && <p role="status" className="text-sm text-success">{message}</p>}{error && <p role="alert" className="text-sm text-danger">{error}</p>}<p className="text-xs text-muted">Looking around first? <Link className="text-brand underline" href="/demo/tour">Explore the sample casebook</Link>.</p></div></main>;
}
