import { supabase } from "./client";
import type { User } from "@supabase/supabase-js";

// ── Google OAuth ───────────────────────────────────────────

/**
 * Opens the Google OAuth consent screen.
 * After the user authenticates, Supabase redirects back to `redirectTo`.
 * Defaults to the current page origin.
 */
export async function signInWithGoogle(redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo ?? window.location.origin,
      queryParams: {
        // Request offline access so Supabase can refresh the session.
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  return data;
}

// ── Session helpers ────────────────────────────────────────

/** Returns the currently logged-in Supabase user, or null. */
export async function getSupabaseUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/** Signs out from Supabase Auth. */
export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Subscribes to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED …).
 * Returns the unsubscribe function — call it on component unmount.
 *
 * Usage:
 *   const unsub = onAuthStateChange((user) => setUser(user));
 *   return () => unsub();
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}
