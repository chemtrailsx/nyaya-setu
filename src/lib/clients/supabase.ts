/**
 * Supabase server client (service role). Optional: the app degrades to
 * in-memory case state + a committed embedded corpus when Supabase isn't
 * configured, so a judge can run the core demo with only an Anthropic key.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config, hasSupabase } from "@/lib/config";

let admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  admin ??= createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: { persistSession: false },
  });
  return admin;
}
