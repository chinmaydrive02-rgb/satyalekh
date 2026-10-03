import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
export default function AccountGate({ feature }: { feature: string }) {
  return <div className="card p-8 max-w-lg flex flex-col gap-4"><LockKeyhole size={26} className="text-brand"/><h2 className="text-xl font-semibold">Your private {feature}</h2><p className="text-sm text-muted">Sign in with a confirmed email to access your saved records. Your workspace belongs to your account.</p><Link href="/account" className="btn btn-primary self-start">Sign in or create an account</Link></div>;
}
