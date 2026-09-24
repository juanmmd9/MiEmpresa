import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";

export const supabaseConfigurado = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("TU-PROYECTO") &&
    SUPABASE_ANON_KEY !== "tu-anon-key",
);

export const supabase = createClient(
  supabaseConfigurado ? SUPABASE_URL : "https://placeholder.supabase.co",
  supabaseConfigurado ? SUPABASE_ANON_KEY : "public-anon-placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
