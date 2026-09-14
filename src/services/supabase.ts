import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function leerEnv(nombre: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY"): string | undefined {
  const valor = import.meta.env[nombre];
  return typeof valor === "string" && valor.length > 0 ? valor : undefined;
}

const supabaseUrl = leerEnv("VITE_SUPABASE_URL");
const supabaseAnonKey = leerEnv("VITE_SUPABASE_ANON_KEY");

export const supabaseConfigurado = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("TU-PROYECTO") &&
    supabaseAnonKey !== "tu-anon-key",
);

export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "public-anon-placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  },
);
