import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { moduloActivo, type ModulosOrg } from "../../lib/modulos";
import { useAuth } from "../auth/AuthContext";
import {
  listarAreas,
  obtenerOrganizacion,
  type AreaOrg,
  type Organizacion,
} from "./organizacionService";

interface OrganizacionContextValue {
  organizacion: Organizacion | null;
  areas: AreaOrg[];
  areasActivas: AreaOrg[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  moduloEncendido: (modulo?: "mantenimiento" | "calidad") => boolean;
  colorMarca: string;
}

const OrganizacionContext = createContext<OrganizacionContextValue | null>(null);

export function OrganizacionProvider({ children }: { children?: ReactNode }) {
  const { perfil } = useAuth();
  const [organizacion, setOrganizacion] = useState<Organizacion | null>(null);
  const [areas, setAreas] = useState<AreaOrg[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    const orgId = perfil?.organizacion_id;
    if (!orgId) {
      setOrganizacion(null);
      setAreas([]);
      setError(null);
      return;
    }
    setCargando(true);
    try {
      const [org, listaAreas] = await Promise.all([obtenerOrganizacion(orgId), listarAreas(orgId)]);
      setOrganizacion(org);
      setAreas(listaAreas);
      setError(org ? null : "No se encontró la empresa de tu usuario.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [perfil?.organizacion_id]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const valor = useMemo<OrganizacionContextValue>(() => {
    const modulos: ModulosOrg | undefined = organizacion?.modulos;
    return {
      organizacion,
      areas,
      areasActivas: areas.filter((a) => a.activa),
      cargando,
      error,
      recargar,
      moduloEncendido: (modulo) => moduloActivo(modulos, modulo),
      colorMarca: organizacion?.color || "#2563eb",
    };
  }, [organizacion, areas, cargando, error, recargar]);

  return (
    <OrganizacionContext.Provider value={valor}>
      {children ?? <Outlet />}
    </OrganizacionContext.Provider>
  );
}

export function useOrganizacion(): OrganizacionContextValue {
  const ctx = useContext(OrganizacionContext);
  if (!ctx) throw new Error("useOrganizacion debe usarse dentro de OrganizacionProvider");
  return ctx;
}
