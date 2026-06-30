import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ConfigurationError, getSupabaseSettings } from "@/lib/server-config";

export function createServiceClient() {
  try {
    const settings = getSupabaseSettings("service");
    if (!settings) return null;
    return createClient(settings.url, settings.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "X-Client-Info": "urban-bee-club-server" } },
    });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error("Supabase service configuration is invalid", error.variable);
      return null;
    }
    throw error;
  }
}
