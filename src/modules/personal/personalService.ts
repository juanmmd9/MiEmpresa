import { supabase } from "../../services/supabase";

export interface Persona {
  id: string;
  organizacion_id: string;
  nombre: string;
  cargo: string | null;
  area: string | null;
  cedula: string | null;
  activo: boolean;
}

export async function listarPersonal(organizacionId: string): Promise<Persona[]> {
  const { data, error } = await supabase
    .from("personal")
    .select("*")
    .eq("organizacion_id", organizacionId)
    .order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []) as Persona[];
}

export async function crearPersona(
  input: Omit<Persona, "id" | "activo"> & { activo?: boolean },
): Promise<Persona> {
  const { data, error } = await supabase.from("personal").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as Persona;
}

export async function actualizarPersona(id: string, cambios: Partial<Persona>): Promise<void> {
  const { error } = await supabase.from("personal").update(cambios).eq("id", id);
  if (error) throw new Error(error.message);
}
