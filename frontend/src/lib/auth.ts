import { createClient } from '@/utils/supabase/client';

/** Verified identity for private saves. Emails typed into search are not identities. */
export async function requireUser() {
  const { data: { user }, error } = await createClient().auth.getUser();
  if (error || !user || !user.email_confirmed_at) {
    if (typeof window !== 'undefined') window.location.assign('/account');
    throw new Error('Sign in with a confirmed email to access your private workspace.');
  }
  return user;
}

/** Backend validates this token; a saved email never grants access. */
export async function authorizationHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await createClient().auth.getSession();
  if (!session) throw new Error('Sign in to access your private workspace.');
  return { Authorization: `Bearer ${session.access_token}` };
}
