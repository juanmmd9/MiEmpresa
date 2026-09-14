import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { etiquetaRol, enlacesParaRol } from "../../modules/auth/roles";
import { useOrganizacion } from "../../modules/organizacion/OrganizacionContext";
import "../../modules/auth/auth.css";
import "./Layout.css";

function Sidebar() {
  const navegar = useNavigate();
  const { perfil, salir } = useAuth();
  const { organizacion, moduloEncendido } = useOrganizacion();
  const enlaces = enlacesParaRol(perfil?.rol, moduloEncendido);

  async function manejarCerrarSesion() {
    await salir();
    navegar("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__marca">
        <img
          className="sidebar__logo"
          src={organizacion?.logo_url || "/logo.svg"}
          alt={organizacion?.nombre || "MiEmpresa"}
        />
        <span className="sidebar__titulo">{organizacion?.nombre || "MiEmpresa"}</span>
      </div>
      <nav className="sidebar__nav">
        {enlaces.map((enlace) => (
          <NavLink
            key={enlace.ruta}
            to={enlace.ruta}
            end={enlace.ruta === "/app"}
            className={({ isActive }) => "sidebar__enlace" + (isActive ? " sidebar__enlace--activo" : "")}
          >
            {enlace.texto}
          </NavLink>
        ))}
      </nav>
      {perfil && (
        <div className="sidebar__usuario">
          <span className="sidebar__usuario-nombre">{perfil.nombre || perfil.usuario}</span>
          <span className="sidebar__usuario-rol">
            {etiquetaRol(perfil.rol)}
            {perfil.area ? ` · ${perfil.area}` : ""}
          </span>
          <button type="button" className="btn sidebar__cerrar-sesion" onClick={() => void manejarCerrarSesion()}>
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
