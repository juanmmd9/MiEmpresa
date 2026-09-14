import { supabase } from "../../services/supabase";
import { emailAuthDesdeUsuario, esUsuarioValido, normalizarUsuario } from "../../lib/emailAuth";
import { slugificar } from "../../lib/slug";
import type { UsuarioPortal } from "./roles";

const TABLA = "usuarios_portal";

export async function obtenerPerfilUsuario(userId: string): Promise<UsuarioPortal | null> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("id, organizacion_id, usuario, email, nombre, rol, personal_id, area, activo")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  if (!data || !data.activo) return null;
  return {
    ...(data as UsuarioPortal),
    usuario: (data as UsuarioPortal).usuario ?? "",
    area: (data as UsuarioPortal).area ?? null,
    organizacion_id: (data as UsuarioPortal).organizacion_id ?? null,
  };
}

async function resolverEmailAuth(loginRaw: string, slugRaw: string): Promise<string> {
  const login = loginRaw.trim().toLowerCase();
  if (!login) throw new Error("Escribe tu usuario o correo.");

  const slug = slugificar(slugRaw);

  const { data, error } = await supabase.rpc("email_auth_por_login", {
    p_login: login,
    p_slug: slug || null,
  });
  if (!error && typeof data === "string" && data.trim()) {
    return data.trim().toLowerCase();
  }

  if (login.includes("@")) return login;

  if (slug && esUsuarioValido(normalizarUsuario(login))) {
    return emailAuthDesdeUsuario(login, slug);
  }

  throw new Error("Usuario, empresa o correo no válido.");
}

export async function iniciarSesion(
  usuarioOCorreo: string,
  password: string,
  slugEmpresa = "",
): Promise<void> {
  const email = await resolverEmailAuth(usuarioOCorreo, slugEmpresa);
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function cerrarSesion(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw new Error(error.message);
}

export async function existeTablaUsuarios(): Promise<boolean> {
  const { error } = await supabase.from(TABLA).select("id").limit(1);
  if (!error) return true;
  if (/usuarios_portal|schema cache|does not exist/i.test(error.message)) return false;
  throw new Error(error.message);
}

export async function listarUsuariosOrg(organizacionId: string): Promise<UsuarioPortal[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("id, organizacion_id, usuario, email, nombre, rol, personal_id, area, activo")
    .eq("organizacion_id", organizacionId)
    .order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []) as UsuarioPortal[];
}

export async function actualizarUsuarioPortal(
  id: string,
  cambios: Partial<Pick<UsuarioPortal, "nombre" | "rol" | "area" | "activo" | "personal_id">>,
): Promise<void> {
  const { error } = await supabase.from(TABLA).update(cambios).eq("id", id);
  if (error) throw new Error(error.message);
}

export interface AltaUsuarioInput {
  organizacionId: string;
  slug: string;
  usuario: string;
  nombre: string;
  password: string;
  rol: UsuarioPortal["rol"];
  area?: string | null;
}

export async function crearUsuarioEmpresa(input: AltaUsuarioInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke("crear-usuario", {
    body: {
      organizacion_id: input.organizacionId,
      slug: input.slug,
      usuario: input.usuario,
      nombre: input.nombre,
      password: input.password,
      rol: input.rol,
      area: input.area ?? null,
    },
  });
  if (error) {
    throw new Error(
      "No se pudo crear el usuario. Despliega la Edge Function crear-usuario o créalo en Authentication y luego en usuarios_portal. " +
        error.message,
    );
  }
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
}
