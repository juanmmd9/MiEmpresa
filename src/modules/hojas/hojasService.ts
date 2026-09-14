import { supabase } from "../../services/supabase";

export interface HojaVida {
  id: string;
  organizacion_id: string;
  codigo: string | null;
  nombre: string;
  area: string;
  frecuencia_pm_meses: number | null;
  primer_pm: string | null;
  activa: boolean;
  foto_url: string | null;
  datos: Record<string, unknown>;
}

export interface HojaVidaInput {
  organizacion_id: string;
  codigo?: string;
  nombre: string;
  area: string;
  frecuencia_pm_meses?: number | null;
  primer_pm?: string | null;
  activa?: boolean;
}

export async function listarHojas(organizacionId: string): Promise<HojaVida[]> {
  const { data, error } = await supabase
    .from("hojas_vida")
    .select("*")
    .eq("organizacion_id", organizacionId)
    .order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []) as HojaVida[];
}

export async function obtenerHoja(id: string): Promise<HojaVida | null> {
  const { data, error } = await supabase.from("hojas_vida").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as HojaVida) ?? null;
}

export async function crearHoja(input: HojaVidaInput): Promise<HojaVida> {
  const { data, error } = await supabase.from("hojas_vida").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as HojaVida;
}

export async function actualizarHoja(id: string, cambios: Partial<HojaVidaInput>): Promise<void> {
  const { error } = await supabase
    .from("hojas_vida")
    .update({ ...cambios, actualizado_en: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function eliminarHoja(id: string): Promise<void> {
  const { error } = await supabase.from("hojas_vida").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function subirFotoHoja(organizacionId: string, archivo: File): Promise<string> {
  const ext = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
  const ruta = `${organizacionId}/equipos/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("adjuntos").upload(ruta, archivo, {
    contentType: archivo.type || "image/jpeg",
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("adjuntos").getPublicUrl(ruta).data.publicUrl;
}
