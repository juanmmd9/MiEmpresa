export type RolPortal =
  | "plataforma"
  | "admin"
  | "operador"
  | "consulta"
  | "solicitante"
  | "lider"
  | "gerencia";

export interface UsuarioPortal {
  id: string;
  organizacion_id: string | null;
  usuario: string;
  email: string;
  nombre: string;
  rol: RolPortal;
  personal_id: string | null;
  area: string | null;
  activo: boolean;
}

export const ETIQUETAS_ROL: Record<RolPortal, string> = {
  plataforma: "Plataforma",
  admin: "Administrador",
  operador: "Operador",
  consulta: "Consulta",
  solicitante: "Solicitante de área",
  lider: "Líder de área",
  gerencia: "Gerencia",
};

export const ROLES_EMPRESA: RolPortal[] = [
  "admin",
  "operador",
  "consulta",
  "solicitante",
  "lider",
  "gerencia",
];

export type Permiso =
  | "ver.inicio"
  | "ver.preventivo"
  | "ver.correctivo"
  | "ver.solicitudes"
  | "ver.hojas"
  | "ver.indicadores"
  | "ver.calidad"
  | "ver.personal"
  | "ver.configuracion"
  | "ver.empresas"
  | "editar.hojas"
  | "editar.personal"
  | "editar.indicadores"
  | "editar.configuracion"
  | "crear.preventivo"
  | "crear.correctivo"
  | "crear.solicitudes"
  | "crear.calidad"
  | "aprobar.preventivo"
  | "eliminar.registros"
  | "gestionar.usuarios"
  | "gestionar.empresas";

const MATRIZ_PERMISOS: Record<Permiso, RolPortal[]> = {
  "ver.inicio": ["admin", "operador", "consulta", "solicitante", "lider"],
  "ver.preventivo": ["admin", "operador", "consulta", "lider"],
  "ver.correctivo": ["admin", "operador", "consulta"],
  "ver.solicitudes": ["admin", "operador", "consulta", "solicitante", "lider"],
  "ver.hojas": ["admin", "operador", "consulta", "solicitante", "lider"],
  "ver.indicadores": ["admin", "consulta", "gerencia"],
  "ver.calidad": ["admin", "lider", "consulta", "gerencia"],
  "ver.personal": ["admin"],
  "ver.configuracion": ["admin"],
  "ver.empresas": ["plataforma"],
  "editar.hojas": ["admin", "operador", "solicitante", "lider"],
  "editar.personal": ["admin"],
  "editar.indicadores": ["admin"],
  "editar.configuracion": ["admin"],
  "crear.preventivo": ["admin", "operador"],
  "crear.correctivo": ["admin", "operador"],
  "crear.solicitudes": ["admin", "operador", "solicitante", "lider"],
  "crear.calidad": ["admin", "lider"],
  "aprobar.preventivo": ["admin", "lider"],
  "eliminar.registros": ["admin"],
  "gestionar.usuarios": ["admin", "plataforma"],
  "gestionar.empresas": ["plataforma"],
};

export function puede(rol: RolPortal | null | undefined, permiso: Permiso): boolean {
  if (!rol) return false;
  return MATRIZ_PERMISOS[permiso]?.includes(rol) ?? false;
}

export interface EnlaceNav {
  ruta: string;
  texto: string;
  permiso: Permiso;
  modulo?: "mantenimiento" | "calidad";
}

export const ENLACES_NAV: EnlaceNav[] = [
  { ruta: "/app", texto: "Inicio", permiso: "ver.inicio", modulo: "mantenimiento" },
  { ruta: "/app/empresas", texto: "Empresas", permiso: "ver.empresas" },
  { ruta: "/app/preventivo", texto: "Mant. preventivo", permiso: "ver.preventivo", modulo: "mantenimiento" },
  {
    ruta: "/app/preventivo/aprobaciones",
    texto: "Aprobar PM",
    permiso: "aprobar.preventivo",
    modulo: "mantenimiento",
  },
  { ruta: "/app/preventivo/cronograma", texto: "Cronograma", permiso: "ver.preventivo", modulo: "mantenimiento" },
  { ruta: "/app/correctivo", texto: "Mant. correctivo", permiso: "ver.correctivo", modulo: "mantenimiento" },
  { ruta: "/app/solicitudes", texto: "Solicitudes", permiso: "ver.solicitudes", modulo: "mantenimiento" },
  { ruta: "/app/hojas-de-vida", texto: "Hojas de vida", permiso: "ver.hojas", modulo: "mantenimiento" },
  { ruta: "/app/indicadores", texto: "Indicadores", permiso: "ver.indicadores", modulo: "mantenimiento" },
  { ruta: "/app/calidad", texto: "Calidad", permiso: "ver.calidad", modulo: "calidad" },
  { ruta: "/app/personal", texto: "Personal", permiso: "ver.personal" },
  { ruta: "/app/personal/usuarios", texto: "Usuarios", permiso: "gestionar.usuarios" },
  { ruta: "/app/configuracion", texto: "Configuración", permiso: "ver.configuracion" },
];

export function enlacesParaRol(
  rol: RolPortal | null | undefined,
  moduloActivoFn: (modulo?: "mantenimiento" | "calidad") => boolean = () => true,
): EnlaceNav[] {
  return ENLACES_NAV.filter((enlace) => puede(rol, enlace.permiso) && moduloActivoFn(enlace.modulo));
}

export function etiquetaRol(rol: RolPortal | string | null | undefined): string {
  if (!rol) return "—";
  return ETIQUETAS_ROL[rol as RolPortal] ?? String(rol);
}

export function rutaInicioParaRol(rol: RolPortal | null | undefined): string {
  if (rol === "plataforma") return "/app/empresas";
  if (rol === "solicitante") return "/app/solicitudes";
  if (rol === "lider") return "/app/preventivo/aprobaciones";
  if (rol === "gerencia") return "/app/indicadores";
  return "/app";
}
