import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabaseConfigurado } from "../../services/supabase";
import { useAuth } from "./AuthContext";
import { existeTablaUsuarios, iniciarSesion } from "./authService";
import {
  borrarCredencialesRecordadas,
  guardarCredencialesRecordadas,
  leerCredencialesRecordadas,
} from "./credencialesRecordadas";
import { rutaInicioParaRol, type RolPortal } from "./roles";
import "./auth.css";

function destinoSeguro(rol: RolPortal | null | undefined, desde: string | null | undefined): string {
  if (desde && desde.startsWith("/app")) return desde;
  return rutaInicioParaRol(rol);
}

function LoginPage() {
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const { session, perfil, cargando, salir } = useAuth();
  const [slug, setSlug] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faltaSchema, setFaltaSchema] = useState(false);
  const [pendienteEntrada, setPendienteEntrada] = useState(false);

  useEffect(() => {
    const guardadas = leerCredencialesRecordadas();
    if (guardadas) {
      setSlug(guardadas.slug);
      setUsuario(guardadas.usuario);
      setPassword(guardadas.password);
      setRecordar(true);
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigurado) return;
    void existeTablaUsuarios()
      .then((ok) => setFaltaSchema(!ok))
      .catch(() => setFaltaSchema(false));
  }, []);

  const desde = (ubicacion.state as { desde?: string } | null)?.desde ?? null;

  useEffect(() => {
    if (!pendienteEntrada || cargando || !session || !perfil) return;
    setPendienteEntrada(false);
    navigate(destinoSeguro(perfil.rol, desde), { replace: true });
  }, [pendienteEntrada, cargando, session, perfil, desde, navigate]);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(usuario.trim(), password, slug.trim());
      if (recordar) guardarCredencialesRecordadas(slug.trim(), usuario.trim(), password);
      else borrarCredencialesRecordadas();
      setPendienteEntrada(true);
    } catch (e) {
      setError("No se pudo iniciar sesión: " + (e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const sesionActiva = !cargando && session && perfil;

  return (
    <div className="auth-login">
      <div className="auth-login__tarjeta">
        <header className="auth-login__marca">
          <img className="auth-login__logo" src="/logo.svg" alt="MiEmpresa" width={72} height={72} />
          <p className="auth-login__marca-texto">Portal multi-empresa</p>
        </header>
        <div className="auth-login__cuerpo">
          <h1>Entrar</h1>
          <p className="auth-login__subtitulo">Mantenimiento y sistema de gestión de calidad</p>

          {!supabaseConfigurado && (
            <p className="auth-login__aviso">
              Copia <code>.env.example</code> a <code>.env</code> con tu proyecto de Supabase.
            </p>
          )}
          {faltaSchema && (
            <p className="auth-login__aviso">
              Falta aplicar <code>supabase/schema.sql</code> en el SQL Editor.
            </p>
          )}

          {sesionActiva ? (
            <div className="auth-login__sesion-activa">
              <p>
                Sesión activa como <strong>{perfil.nombre || perfil.usuario}</strong>.
              </p>
              <div className="auth-login__sesion-acciones">
                <button
                  type="button"
                  className="btn btn--primario"
                  onClick={() => navigate(rutaInicioParaRol(perfil.rol))}
                >
                  Ir al portal
                </button>
                <button type="button" className="btn" onClick={() => void salir()}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <form className="auth-login__form" onSubmit={(e) => void manejarEnvio(e)}>
              <label>
                Empresa (slug)
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme — vacío si eres plataforma"
                  autoComplete="organization"
                />
              </label>
              <label>
                Usuario o correo
                <input
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin o correo"
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Contraseña
                <span className="auth-login__clave-fila">
                  <input
                    type={mostrarClave ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-login__ver-clave"
                    onClick={() => setMostrarClave((v) => !v)}
                  >
                    {mostrarClave ? "Ocultar" : "Ver"}
                  </button>
                </span>
              </label>
              <label className="auth-login__recordar">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                />
                Recordar en este equipo
              </label>
              {error && <p className="auth-login__error">{error}</p>}
              <button className="btn btn--primario auth-login__btn" type="submit" disabled={enviando}>
                {enviando ? "Entrando..." : "Entrar"}
              </button>
            </form>
          )}

          <Link className="auth-login__enlace" to="/">
            Volver al sitio
          </Link>
          <p className="auth-login__pie">MiEmpresa</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
