import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import CargaPantalla from "../../components/CargaPantalla";
import { useAuth } from "./AuthContext";
import "./auth.css";

function RequireAuth() {
  const navegar = useNavigate();
  const { session, perfil, cargando, errorPerfil, salir } = useAuth();
  const ubicacion = useLocation();

  async function manejarCerrarSesion() {
    await salir();
    navegar("/login", { replace: true });
  }

  if (cargando) {
    return <CargaPantalla mensaje="Verificando sesión..." pantallaCompleta />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  if (!perfil) {
    return (
      <div className="auth-sin-perfil">
        <h1>Sin acceso al portal</h1>
        <p>{errorPerfil ?? "Tu cuenta no tiene un rol asignado."}</p>
        <p className="auth-sin-perfil__ayuda">
          Aplica <code>supabase/schema.sql</code> y agrega tu fila en <code>usuarios_portal</code>.
        </p>
        <button type="button" className="btn" onClick={() => void manejarCerrarSesion()}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  return <Outlet />;
}

export default RequireAuth;
