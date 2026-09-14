import type { Permiso } from "../modules/auth/roles";

export function permisoParaRuta(pathname: string): Permiso | null {
  if (pathname === "/app" || pathname === "/app/") return "ver.inicio";
  if (pathname.startsWith("/app/empresas")) return "ver.empresas";
  if (pathname.startsWith("/app/solicitudes")) return "ver.solicitudes";
  if (pathname.startsWith("/app/preventivo")) return "ver.preventivo";
  if (pathname.startsWith("/app/correctivo")) return "ver.correctivo";
  if (pathname.startsWith("/app/hojas-de-vida")) return "ver.hojas";
  if (pathname.startsWith("/app/indicadores")) return "ver.indicadores";
  if (pathname.startsWith("/app/calidad")) return "ver.calidad";
  if (pathname === "/app/personal/usuarios") return "gestionar.usuarios";
  if (pathname.startsWith("/app/personal")) return "ver.personal";
  if (pathname.startsWith("/app/configuracion")) return "ver.configuracion";
  return null;
}
