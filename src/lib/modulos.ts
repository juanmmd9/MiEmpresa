export type ModuloProducto = "mantenimiento" | "calidad";

export interface ModulosOrg {
  mantenimiento: boolean;
  calidad: boolean;
}

export const MODULOS_POR_DEFECTO: ModulosOrg = {
  mantenimiento: true,
  calidad: true,
};

export function normalizarModulos(valor: unknown): ModulosOrg {
  const raw = valor && typeof valor === "object" ? (valor as Record<string, unknown>) : {};
  return {
    mantenimiento: raw.mantenimiento !== false,
    calidad: raw.calidad !== false,
  };
}

export function moduloActivo(modulos: ModulosOrg | null | undefined, modulo?: ModuloProducto): boolean {
  if (!modulo) return true;
  if (!modulos) return true;
  return Boolean(modulos[modulo]);
}
