import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase, supabaseConfigurado } from "../lib/supabase";
import { slugificar } from "../lib/util";
import { rutaInicio } from "../lib/roles";
import { useApp } from "../state/AppContext";

export default function LoginPage() {
  const { session, perfil, recargar } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (session && perfil) return <Navigate to={rutaInicio(perfil.rol)} replace />;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    const fd = new FormData(evento.currentTarget);
    const login = String(fd.get("usuario") || "").trim().toLowerCase();
    const slug = slugificar(String(fd.get("slug") || ""));
    const password = String(fd.get("password") || "");
    try {
      const { data, error: rpcError } = await supabase.rpc("email_auth_por_login", {
        p_login: login,
        p_slug: slug || null,
      });
      const email =
        !rpcError && typeof data === "string" && data.trim()
          ? data.trim()
          : login.includes("@")
            ? login
            : `${login}@${slug}.miempresa.local`;
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      await recargar();
    } catch (e) {
      setError("No se pudo iniciar sesión: " + (e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-login">
      <div className="auth-login__tarjeta">
        <header className="auth-login__marca">
          <img
            className="auth-login__logo"
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="MiEmpresa"
            width={72}
            height={72}
          />
          <p className="auth-login__marca-texto">Portal multi-empresa</p>
        </header>
        <div className="auth-login__cuerpo">
          <h1>Entrar</h1>
          <p className="auth-login__subtitulo">Mantenimiento y sistema de gestión de calidad</p>
          {!supabaseConfigurado && (
            <p className="auth-login__aviso">
              Edita <code>src/config.ts</code> con la URL y anon key de Supabase.
            </p>
          )}
          <form className="auth-login__form" onSubmit={(e) => void enviar(e)}>
            <label>
              Empresa (slug)
              <input name="slug" placeholder="acme — vacío si eres plataforma" autoComplete="organization" />
            </label>
            <label>
              Usuario o correo
              <input name="usuario" required placeholder="admin o correo" autoComplete="username" />
            </label>
            <label>
              Contraseña
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            {error && <p className="auth-login__error">{error}</p>}
            <button className="btn btn--primario auth-login__btn" type="submit" disabled={enviando}>
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <Link className="auth-login__enlace" to="/">
            Volver al sitio
          </Link>
          <p className="auth-login__pie">MiEmpresa</p>
        </div>
      </div>
    </div>
  );
}
