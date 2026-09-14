import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { rutaInicioParaRol } from "../../modules/auth/roles";
import { useOrganizacion } from "../../modules/organizacion/OrganizacionContext";
import { permisoParaRuta } from "../../lib/guardRutas";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import "./Layout.css";

function Layout() {
  const ubicacion = useLocation();
  const { perfil, rol, puede } = useAuth();
  const { organizacion, colorMarca } = useOrganizacion();

  const permisoRuta = permisoParaRuta(ubicacion.pathname);
  if (permisoRuta && !puede(permisoRuta)) {
    const destino = rutaInicioParaRol(rol);
    if (destino !== ubicacion.pathname) {
      return <Navigate to={destino} replace />;
    }
  }

  return (
    <div className="layout" style={{ ["--color-primario" as string]: colorMarca }}>
      <Sidebar />
      <div className="layout__cuerpo">
        <header className="layout__topbar">
          <span className="layout__topbar-titulo">{organizacion?.nombre || "MiEmpresa"}</span>
          {perfil ? <span>{perfil.nombre || perfil.usuario}</span> : null}
        </header>
        <main className="layout__contenido">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export default Layout;
