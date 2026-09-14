import { supabase } from "../../services/supabase";
import { MODULOS_POR_DEFECTO, normalizarModulos, type ModulosOrg } from "../../lib/modulos";
import { slugificar } from "../../lib/slug";

export interface Organizacion {
  id: string;
  slug: string;
  nombre: string;
  logo_url: string | null;
  color: string;
  modulos: ModulosOrg;
  activa: boolean;
}

export interface AreaOrg {
  id: string;
  organizacion_id: string;
  nombre: string;
  tiene_preventivo: boolean;
  activa: boolean;
  orden: number;
}

function mapOrg(row: Record<string, unknown>): Organizacion {
  return {
    id: String(row.id),
    slug: String(row.slug),
    nombre: String(row.nombre),
    logo_url: (row.logo_url as string | null) ?? null,
    color: String(row.color ?? "#2563eb"),
    modulos: normalizarModulos(row.modulos),
    activa: Boolean(row.activa),
  };
}

export async function obtenerOrganizacion(id: string): Promise<Organizacion | null> {
  const { data, error } = await supabase.from("organizaciones").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapOrg(data as Record<string, unknown>) : null;
}

export async function listarOrganizaciones(): Promise<Organizacion[]> {
  const { data, error } = await supabase.from("organizaciones").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapOrg(row as Record<string, unknown>));
}

export async function crearOrganizacion(input: {
  nombre: string;
  slug?: string;
  color?: string;
}): Promise<Organizacion> {
  const slug = slugificar(input.slug || input.nombre);
  const { data, error } = await supabase
    .from("organizaciones")
    .insert({
      nombre: input.nombre.trim(),
      slug,
      color: input.color || "#2563eb",
      modulos: MODULOS_POR_DEFECTO,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapOrg(data as Record<string, unknown>);
}

export async function actualizarOrganizacion(
  id: string,
  cambios: Partial<Pick<Organizacion, "nombre" | "logo_url" | "color" | "modulos" | "activa">>,
): Promise<void> {
  const { error } = await supabase.from("organizaciones").update(cambios).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listarAreas(organizacionId: string): Promise<AreaOrg[]> {
  const { data, error } = await supabase
    .from("areas")
    .select("*")
    .eq("organizacion_id", organizacionId)
    .order("orden")
    .order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []) as AreaOrg[];
}

export async function crearArea(
  organizacionId: string,
  nombre: string,
  tienePreventivo = true,
): Promise<AreaOrg> {
  const { data, error } = await supabase
    .from("areas")
    .insert({
      organizacion_id: organizacionId,
      nombre: nombre.trim(),
      tiene_preventivo: tienePreventivo,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as AreaOrg;
}

export async function actualizarArea(
  id: string,
  cambios: Partial<Pick<AreaOrg, "nombre" | "tiene_preventivo" | "activa" | "orden">>,
): Promise<void> {
  const { error } = await supabase.from("areas").update(cambios).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function eliminarArea(id: string): Promise<void> {
  const { error } = await supabase.from("areas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function subirLogoOrg(organizacionId: string, archivo: File): Promise<string> {
  const ext = archivo.name.split(".").pop()?.toLowerCase() || "png";
  const ruta = `${organizacionId}/logo.${ext}`;
  const { error } = await supabase.storage.from("adjuntos").upload(ruta, archivo, {
    upsert: true,
    contentType: archivo.type || "image/png",
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("adjuntos").getPublicUrl(ruta);
  return `${data.publicUrl}?t=${Date.now()}`;
}
