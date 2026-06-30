import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ConfigurationError, getSupabaseSettings } from "@/lib/server-config";

export async function createAuthClient() {
  let settings: ReturnType<typeof getSupabaseSettings>;
  try {
    settings = getSupabaseSettings("auth");
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error("Supabase auth configuration is invalid", error.variable);
      return null;
    }
    throw error;
  }
  if (!settings) return null;
  const store = await cookies();
  return createServerClient(settings.url, settings.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => store.set(name, value, {
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
          }));
        } catch {
          // Server Components cannot set refreshed cookies. Route Handlers can.
        }
      },
    },
  });
}
