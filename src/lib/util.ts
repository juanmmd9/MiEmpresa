export function slugificar(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function periodoMes(): string {
  return new Date().toISOString().slice(0, 7);
}

export function throwIf(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export function datosDe(valor: unknown): Record<string, unknown> {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) {
    return valor as Record<string, unknown>;
  }
  return {};
}

export function texto(valor: unknown, fallback = "—"): string {
  if (valor == null || valor === "") return fallback;
  return String(valor);
}
