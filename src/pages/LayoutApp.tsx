import { useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { enlacesDe, etiquetaRol, permisoRuta, rutaInicio } from "../lib/roles";
import { useApp } from "../state/AppContext";

export default function LayoutApp() {
  const { perfil, org, rol, puede, salir, cargando } = useApp();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const [mas, setMas] = useState(false);
  const enlaces = enlacesDe(rol, org?.modulos);
  const tabs = enlaces.slice(0, 3);
  const extra = enlaces.slice(3);

  if (cargando) {
    return (
      <div className="carga-pantalla carga-pantalla--completa">
        <div className="carga-pantalla__spinner" />
        <p>Verificando sesión…</p>
      </div>
    );
  }

  if (!perfil) return <Navigate to="/login" replace />;

  const permiso = permisoRuta(ubicacion.pathname);
  if (permiso && !puede(permiso)) {
    return <Navigate to={rutaInicio(rol)} replace />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__marca">
          <img
            className="sidebar__logo"
            src={org?.logo_url || `${import.meta.env.BASE_URL}logo.svg`}
            alt={org?.nombre || "MiEmpresa"}
          />
          <span className="sidebar__titulo">{org?.nombre || "MiEmpresa"}</span>
        </div>
        <nav className="sidebar__nav">
          {enlaces.map((e) => (
            <NavLink
              key={e.ruta}
              to={e.ruta}
              end={e.ruta === "/app"}
              className={({ isActive }) => "sidebar__enlace" + (isActive ? " sidebar__enlace--activo" : "")}
            >
              {e.texto}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__usuario">
          <span className="sidebar__usuario-nombre">{perfil.nombre || perfil.usuario}</span>
          <span className="sidebar__usuario-rol">
            {etiquetaRol(perfil.rol)}
            {perfil.area ? ` · ${perfil.area}` : ""}
          </span>
          <button
            type="button"
            className="btn sidebar__cerrar-sesion"
            onClick={() => void salir().then(() => navegar("/login"))}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="layout__cuerpo">
        <header className="layout__topbar">
          <span className="layout__topbar-titulo">{org?.nombre || "MiEmpresa"}</span>
        </header>
        <main className="layout__contenido">
          <Outlet />
        </main>
        <nav className="bottom-nav">
          {tabs.map((e) => (
            <NavLink
              key={e.ruta}
              to={e.ruta}
              end={e.ruta === "/app"}
              className={({ isActive }) => "bottom-nav__item" + (isActive ? " bottom-nav__item--activo" : "")}
            >
              {e.texto}
            </NavLink>
          ))}
          {extra.length > 0 && (
            <button type="button" className="bottom-nav__item" onClick={() => setMas(true)}>
              Más
            </button>
          )}
        </nav>
      </div>
      {mas && (
        <div className="mas-sheet">
          <button type="button" className="mas-sheet__fondo" aria-label="Cerrar" onClick={() => setMas(false)} />
          <div className="mas-sheet__panel">
            <h2>Más módulos</h2>
            <div className="mas-sheet__grid">
              {extra.map((e) => (
                <button
                  key={e.ruta}
                  type="button"
                  className="mas-sheet__tile"
                  onClick={() => {
                    setMas(false);
                    navegar(e.ruta);
                  }}
                >
                  {e.texto}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
