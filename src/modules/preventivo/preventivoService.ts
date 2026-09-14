import { supabase } from "../../services/supabase";

export type EstadoPm = "pendiente" | "pendiente_aprobacion" | "aprobado";

export interface RegistroPreventivo {
  id: string;
  organizacion_id: string;
  hoja_id: string | null;
  personal_id: string | null;
  area: string;
  fecha: string;
  descripcion: string | null;
  adjunto_url: string | null;
  datos: {
    estado?: EstadoPm;
    equipo?: string;
    ejecutado_por?: string;
    observaciones?: string;
    firma?: boolean;
  };
}

export async function listarPreventivo(organizacionId: string): Promise<RegistroPreventivo[]> {
  const { data, error } = await supabase
    .from("preventivo")
    .select("*")
    .eq("organizacion_id", organizacionId)
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroPreventivo[];
}

export async function crearPreventivo(
  input: Omit<RegistroPreventivo, "id">,
): Promise<RegistroPreventivo> {
  const { data, error } = await supabase.from("preventivo").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as RegistroPreventivo;
}

export async function actualizarPreventivo(
  id: string,
  cambios: Partial<Pick<RegistroPreventivo, "descripcion" | "datos" | "fecha" | "area">>,
): Promise<void> {
  const { error } = await supabase.from("preventivo").update(cambios).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function eliminarPreventivo(id: string): Promise<void> {
  const { error } = await supabase.from("preventivo").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export interface CitaCronograma {
  id: string;
  organizacion_id: string;
  hoja_id: string;
  fecha: string;
  datos: Record<string, unknown>;
}

export async function listarCronograma(organizacionId: string, desde: string, hasta: string) {
  const { data, error } = await supabase
    .from("cronograma")
    .select("*")
    .eq("organizacion_id", organizacionId)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha");
  if (error) throw new Error(error.message);
  return (data ?? []) as CitaCronograma[];
}

export async function crearCitaCronograma(
  organizacionId: string,
  hojaId: string,
  fecha: string,
): Promise<void> {
  const { error } = await supabase.from("cronograma").insert({
    organizacion_id: organizacionId,
    hoja_id: hojaId,
    fecha,
  });
  if (error) throw new Error(error.message);
}

export function estadoPm(registro: RegistroPreventivo): EstadoPm {
  return registro.datos.estado ?? "pendiente";
}
