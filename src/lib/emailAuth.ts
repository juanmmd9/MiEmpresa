const RE_USUARIO = /^[a-z0-9][a-z0-9._-]{1,62}$/;
const DOMINIO_INTERNO = "miempresa.local";

export function normalizarUsuario(valor: string): string {
  return valor.trim().toLowerCase();
}

export function esUsuarioValido(valor: string): boolean {
  return RE_USUARIO.test(normalizarUsuario(valor));
}

/** Email sintético de Auth para usuarios de una empresa. */
export function emailAuthDesdeUsuario(usuario: string, slug: string): string {
  return `${normalizarUsuario(usuario)}@${slug}.${DOMINIO_INTERNO}`;
}
