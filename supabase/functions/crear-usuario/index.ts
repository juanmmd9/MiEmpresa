import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!authHeader) return json({ error: "Falta Authorization" }, 401);

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceKey);

  const {
    data: { user },
    error: userError,
  } = await caller.auth.getUser();
  if (userError || !user) return json({ error: "Sesión inválida" }, 401);

  const { data: perfil } = await admin
    .from("usuarios_portal")
    .select("rol, organizacion_id, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil?.activo) return json({ error: "Sin perfil activo" }, 403);

  const body = await req.json();
  const organizacionId = String(body.organizacion_id ?? "");
  const slug = String(body.slug ?? "").toLowerCase();
  const usuario = String(body.usuario ?? "").trim().toLowerCase();
  const nombre = String(body.nombre ?? "").trim();
  const password = String(body.password ?? "");
  const rol = String(body.rol ?? "operador");
  const area = body.area ? String(body.area) : null;

  if (!organizacionId || !slug || !usuario || !password || !nombre) {
    return json({ error: "Faltan datos (organizacion, slug, usuario, nombre, password)" }, 400);
  }

  const esPlataforma = perfil.rol === "plataforma";
  const esAdminOrg = perfil.rol === "admin" && perfil.organizacion_id === organizacionId;
  if (!esPlataforma && !esAdminOrg) {
    return json({ error: "No autorizado para crear usuarios en esa empresa" }, 403);
  }
  if (rol === "plataforma" && !esPlataforma) {
    return json({ error: "Solo plataforma puede crear ese rol" }, 403);
  }

  const email = `${usuario}@${slug}.miempresa.local`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return json({ error: createError?.message ?? "No se creó el usuario Auth" }, 400);
  }

  const { error: insertError } = await admin.from("usuarios_portal").insert({
    id: created.user.id,
    organizacion_id: organizacionId,
    usuario,
    email,
    nombre,
    rol,
    area,
    activo: true,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: insertError.message }, 400);
  }

  return json({ ok: true, id: created.user.id, email });
});
