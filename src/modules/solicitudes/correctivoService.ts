import { supabase } from "../../services/supabase";

export type EstadoSolicitud = "abierta" | "en_proceso" | "cerrada";

export interface RegistroCorrectivo {
  id: string;
  organizacion_id: string;
  personal_id: string | null;
  area: string;
  fecha: string;
  datos: {
    tipo?: "solicitud" | "historico";
    estado?: EstadoSolicitud;
    equipo?: string;
    descripcion?: string;
    solicitante?: string;
    intervencion?: string;
    causa?: string;
  };
}

export async function listarCorrectivo(organizacionId: string): Promise<RegistroCorrectivo[]> {
  const { data, error } = await supabase
    .from("correctivo")
    .select("*")
    .eq("organizacion_id", organizacionId)
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroCorrectivo[];
}

export async function crearCorrectivo(input: Omit<RegistroCorrectivo, "id">): Promise<RegistroCorrectivo> {
  const { data, error } = await supabase.from("correctivo").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as RegistroCorrectivo;
}

export async function actualizarCorrectivo(
  id: string,
  cambios: Partial<Pick<RegistroCorrectivo, "datos" | "area" | "fecha" | "personal_id">>,
): Promise<void> {
  const { error } = await supabase.from("correctivo").update(cambios).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function eliminarCorrectivo(id: string): Promise<void> {
  const { error } = await supabase.from("correctivo").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function esSolicitud(item: RegistroCorrectivo): boolean {
  return (item.datos.tipo ?? "solicitud") === "solicitud";
}

export function estadoSolicitud(item: RegistroCorrectivo): EstadoSolicitud {
  return item.datos.estado ?? "abierta";
}
