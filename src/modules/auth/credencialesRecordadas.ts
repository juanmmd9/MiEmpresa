const CLAVE = "miempresa.login";

export function leerCredencialesRecordadas(): {
  slug: string;
  usuario: string;
  password: string;
} | null {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return null;
    const data = JSON.parse(raw) as { slug?: string; usuario?: string; password?: string };
    if (!data.usuario || !data.password) return null;
    return { slug: data.slug ?? "", usuario: data.usuario, password: data.password };
  } catch {
    return null;
  }
}

export function guardarCredencialesRecordadas(slug: string, usuario: string, password: string): void {
  localStorage.setItem(CLAVE, JSON.stringify({ slug, usuario, password }));
}

export function borrarCredencialesRecordadas(): void {
  localStorage.removeItem(CLAVE);
}
