import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/layout/Layout";
import { AuthProvider, useAuth } from "./modules/auth/AuthContext";
import LoginPage from "./modules/auth/LoginPage";
import RequireAuth from "./modules/auth/RequireAuth";
import UsuariosPage from "./modules/auth/UsuariosPage";
import CalidadListaPage from "./modules/calidad/CalidadListaPage";
import CalidadPage from "./modules/calidad/CalidadPage";
import ConfiguracionPage from "./modules/configuracion/ConfiguracionPage";
import CorrectivoPage from "./modules/correctivo/CorrectivoPage";
import HojaDetallePage from "./modules/hojas/HojaDetallePage";
import HojasPage from "./modules/hojas/HojasPage";
import IndicadoresPage from "./modules/indicadores/IndicadoresPage";
import InicioPage from "./modules/inicio/InicioPage";
import LandingPage from "./modules/landing/LandingPage";
import { OrganizacionProvider, useOrganizacion } from "./modules/organizacion/OrganizacionContext";
import PersonalPage from "./modules/personal/PersonalPage";
import EmpresasPage from "./modules/plataforma/EmpresasPage";
import AprobacionPmPage from "./modules/preventivo/AprobacionPmPage";
import CronogramaPage from "./modules/preventivo/CronogramaPage";
import PreventivoPage from "./modules/preventivo/PreventivoPage";
import SolicitudesPage from "./modules/solicitudes/SolicitudesPage";
import { rutaInicioParaRol } from "./modules/auth/roles";

function RequireModulo({ modulo }: { modulo: "mantenimiento" | "calidad" }) {
  const { rol } = useAuth();
  const { moduloEncendido } = useOrganizacion();
  const ubicacion = useLocation();
  if (!moduloEncendido(modulo)) {
    const destino = rutaInicioParaRol(rol);
    if (destino === ubicacion.pathname) {
      return <p className="aviso">Este módulo no está activo para tu empresa.</p>;
    }
    return <Navigate to={destino} replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<OrganizacionProvider />}>
          <Route path="/app" element={<Layout />}>
            <Route index element={<InicioPage />} />
            <Route path="empresas" element={<EmpresasPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
            <Route path="personal" element={<PersonalPage />} />
            <Route path="personal/usuarios" element={<UsuariosPage />} />
            <Route element={<RequireModulo modulo="mantenimiento" />}>
              <Route path="preventivo" element={<PreventivoPage />} />
              <Route path="preventivo/aprobaciones" element={<AprobacionPmPage />} />
              <Route path="preventivo/cronograma" element={<CronogramaPage />} />
              <Route path="correctivo" element={<CorrectivoPage />} />
              <Route path="solicitudes" element={<SolicitudesPage />} />
              <Route path="hojas-de-vida" element={<HojasPage />} />
              <Route path="hojas-de-vida/:id" element={<HojaDetallePage />} />
              <Route path="indicadores" element={<IndicadoresPage />} />
            </Route>
            <Route element={<RequireModulo modulo="calidad" />}>
              <Route path="calidad" element={<CalidadPage />} />
              <Route path="calidad/:tipo" element={<CalidadListaPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
