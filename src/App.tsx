import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { moduloActivo } from "./lib/roles";
import { AppProvider, useApp } from "./state/AppContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import LayoutApp from "./pages/LayoutApp";
import InicioPage from "./pages/InicioPage";
import EmpresasPage from "./pages/EmpresasPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import HojasPage from "./pages/HojasPage";
import PreventivoPage from "./pages/PreventivoPage";
import AprobacionPage from "./pages/AprobacionPage";
import CronogramaPage from "./pages/CronogramaPage";
import SolicitudesPage from "./pages/SolicitudesPage";
import CorrectivoPage from "./pages/CorrectivoPage";
import IndicadoresPage from "./pages/IndicadoresPage";
import CalidadPage from "./pages/CalidadPage";
import PersonalPage from "./pages/PersonalPage";
import UsuariosPage from "./pages/UsuariosPage";

function GuardModulo({
  modulo,
  children,
}: {
  modulo: "mantenimiento" | "calidad";
  children: ReactNode;
}) {
  const { org } = useApp();
  if (org && !moduloActivo(org.modulos, modulo)) {
    return <p className="aviso">El módulo de {modulo} no está activo para tu empresa.</p>;
  }
  return children;
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
  return (
    <BrowserRouter basename={basename}>
      <AppProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<LayoutApp />}>
            <Route index element={<InicioPage />} />
            <Route path="empresas" element={<EmpresasPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
            <Route
              path="preventivo"
              element={
                <GuardModulo modulo="mantenimiento">
                  <PreventivoPage />
                </GuardModulo>
              }
            />
            <Route
              path="preventivo/aprobaciones"
              element={
                <GuardModulo modulo="mantenimiento">
                  <AprobacionPage />
                </GuardModulo>
              }
            />
            <Route
              path="preventivo/cronograma"
              element={
                <GuardModulo modulo="mantenimiento">
                  <CronogramaPage />
                </GuardModulo>
              }
            />
            <Route
              path="correctivo"
              element={
                <GuardModulo modulo="mantenimiento">
                  <CorrectivoPage />
                </GuardModulo>
              }
            />
            <Route
              path="solicitudes"
              element={
                <GuardModulo modulo="mantenimiento">
                  <SolicitudesPage />
                </GuardModulo>
              }
            />
            <Route
              path="hojas-de-vida"
              element={
                <GuardModulo modulo="mantenimiento">
                  <HojasPage />
                </GuardModulo>
              }
            />
            <Route
              path="hojas-de-vida/:id"
              element={
                <GuardModulo modulo="mantenimiento">
                  <HojasPage />
                </GuardModulo>
              }
            />
            <Route
              path="indicadores"
              element={
                <GuardModulo modulo="mantenimiento">
                  <IndicadoresPage />
                </GuardModulo>
              }
            />
            <Route
              path="calidad"
              element={
                <GuardModulo modulo="calidad">
                  <CalidadPage />
                </GuardModulo>
              }
            />
            <Route
              path="calidad/:tipo"
              element={
                <GuardModulo modulo="calidad">
                  <CalidadPage />
                </GuardModulo>
              }
            />
            <Route path="personal" element={<PersonalPage />} />
            <Route path="personal/usuarios" element={<UsuariosPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
