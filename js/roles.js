export const ETIQUETAS_ROL = {
  plataforma: "Plataforma",
  admin: "Administrador",
  operador: "Operador",
  consulta: "Consulta",
  solicitante: "Solicitante de área",
  lider: "Líder de área",
  gerencia: "Gerencia",
};

export const ROLES_EMPRESA = ["admin", "operador", "consulta", "solicitante", "lider", "gerencia"];

const MATRIZ = {
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

export const ENLACES = [
  { ruta: "#/app", texto: "Inicio", permiso: "ver.inicio", modulo: "mantenimiento" },
  { ruta: "#/app/empresas", texto: "Empresas", permiso: "ver.empresas" },
  { ruta: "#/app/preventivo", texto: "Mant. preventivo", permiso: "ver.preventivo", modulo: "mantenimiento" },
  { ruta: "#/app/preventivo/aprobaciones", texto: "Aprobar PM", permiso: "aprobar.preventivo", modulo: "mantenimiento" },
  { ruta: "#/app/preventivo/cronograma", texto: "Cronograma", permiso: "ver.preventivo", modulo: "mantenimiento" },
  { ruta: "#/app/correctivo", texto: "Mant. correctivo", permiso: "ver.correctivo", modulo: "mantenimiento" },
  { ruta: "#/app/solicitudes", texto: "Solicitudes", permiso: "ver.solicitudes", modulo: "mantenimiento" },
  { ruta: "#/app/hojas-de-vida", texto: "Hojas de vida", permiso: "ver.hojas", modulo: "mantenimiento" },
  { ruta: "#/app/indicadores", texto: "Indicadores", permiso: "ver.indicadores", modulo: "mantenimiento" },
  { ruta: "#/app/calidad", texto: "Calidad", permiso: "ver.calidad", modulo: "calidad" },
  { ruta: "#/app/personal", texto: "Personal", permiso: "ver.personal" },
  { ruta: "#/app/personal/usuarios", texto: "Usuarios", permiso: "gestionar.usuarios" },
  { ruta: "#/app/configuracion", texto: "Configuración", permiso: "ver.configuracion" },
];

export function puede(rol, permiso) {
  return Boolean(rol && MATRIZ[permiso]?.includes(rol));
}

export function etiquetaRol(rol) {
  return ETIQUETAS_ROL[rol] || rol || "—";
}

export function rutaInicio(rol) {
  if (rol === "plataforma") return "#/app/empresas";
  if (rol === "solicitante") return "#/app/solicitudes";
  if (rol === "lider") return "#/app/preventivo/aprobaciones";
  if (rol === "gerencia") return "#/app/indicadores";
  return "#/app";
}

export function moduloActivo(modulos, modulo) {
  if (!modulo) return true;
  if (!modulos) return true;
  return modulos[modulo] !== false;
}

export function enlacesDe(rol, modulos) {
  return ENLACES.filter((e) => puede(rol, e.permiso) && moduloActivo(modulos, e.modulo));
}

export function permisoRuta(path) {
  if (path === "/app") return "ver.inicio";
  if (path.startsWith("/app/empresas")) return "ver.empresas";
  if (path.startsWith("/app/solicitudes")) return "ver.solicitudes";
  if (path.startsWith("/app/preventivo")) return "ver.preventivo";
  if (path.startsWith("/app/correctivo")) return "ver.correctivo";
  if (path.startsWith("/app/hojas-de-vida")) return "ver.hojas";
  if (path.startsWith("/app/indicadores")) return "ver.indicadores";
  if (path.startsWith("/app/calidad")) return "ver.calidad";
  if (path === "/app/personal/usuarios") return "gestionar.usuarios";
  if (path.startsWith("/app/personal")) return "ver.personal";
  if (path.startsWith("/app/configuracion")) return "ver.configuracion";
  return null;
}
