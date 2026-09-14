import { supabase } from "../../services/supabase";

export interface RegistroCalidad {
  id: string;
  organizacion_id: string;
  numero: number;
  pdf_url?: string | null;
  datos: Record<string, unknown>;
  creado_en: string;
}

type TablaCalidad = "no_conformidades" | "acciones_mejora" | "gestion_cambio";

export async function listarCalidad(
  tabla: TablaCalidad,
  organizacionId: string,
): Promise<RegistroCalidad[]> {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("organizacion_id", organizacionId)
    .order("numero", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroCalidad[];
}

export async function crearCalidad(
  tabla: TablaCalidad,
  organizacionId: string,
  datos: Record<string, unknown>,
): Promise<RegistroCalidad> {
  const { data, error } = await supabase
    .from(tabla)
    .insert({ organizacion_id: organizacionId, datos })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as RegistroCalidad;
}

export async function actualizarCalidad(
  tabla: TablaCalidad,
  id: string,
  datos: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from(tabla).update({ datos }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function eliminarCalidad(tabla: TablaCalidad, id: string): Promise<void> {
  const { error } = await supabase.from(tabla).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listarHorasProgramadas(organizacionId: string, periodo: string) {
  const { data, error } = await supabase
    .from("horas_programadas")
    .select("*")
    .eq("organizacion_id", organizacionId)
    .eq("periodo", periodo);
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; area: string; horas: number; periodo: string }[];
}

export async function guardarHorasProgramadas(
  organizacionId: string,
  periodo: string,
  area: string,
  horas: number,
): Promise<void> {
  const { error } = await supabase.from("horas_programadas").upsert(
    { organizacion_id: organizacionId, periodo, area, horas },
    { onConflict: "organizacion_id,periodo,area" },
  );
  if (error) throw new Error(error.message);
}
