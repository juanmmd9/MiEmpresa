import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigurado } from "../lib/supabase";
import { type Permiso, type RolPortal, type UsuarioPortal, puede } from "../lib/roles";

export interface Organizacion {
  id: string;
  slug: string;
  nombre: string;
  logo_url: string | null;
  color: string;
  modulos: { mantenimiento: boolean; calidad: boolean };
  activa: boolean;
}

export interface AreaOrg {
  id: string;
  organizacion_id: string;
  nombre: string;
  tiene_preventivo: boolean;
  activa: boolean;
  orden: number;
}

interface AppState {
  session: Session | null;
  perfil: UsuarioPortal | null;
  org: Organizacion | null;
  areas: AreaOrg[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  salir: () => Promise<void>;
  puede: (permiso: Permiso) => boolean;
  rol: RolPortal | null;
  areasActivas: AreaOrg[];
}

const Ctx = createContext<AppState | null>(null);

function mapOrg(row: Record<string, unknown> | null): Organizacion | null {
  if (!row) return null;
  const mods = (row.modulos ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    slug: String(row.slug),
    nombre: String(row.nombre),
    logo_url: (row.logo_url as string | null) ?? null,
    color: String(row.color ?? "#2563eb"),
    modulos: {
      mantenimiento: mods.mantenimiento !== false,
      calidad: mods.calidad !== false,
    },
    activa: Boolean(row.activa),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<UsuarioPortal | null>(null);
  const [org, setOrg] = useState<Organizacion | null>(null);
  const [areas, setAreas] = useState<AreaOrg[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (!supabaseConfigurado) {
      setCargando(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (!data.session?.user.id) {
      setPerfil(null);
      setOrg(null);
      setAreas([]);
      setCargando(false);
      return;
    }
    const { data: fila, error: errPerfil } = await supabase
      .from("usuarios_portal")
      .select("id, organizacion_id, usuario, email, nombre, rol, personal_id, area, activo")
      .eq("id", data.session.user.id)
      .maybeSingle();
    if (errPerfil) setError(errPerfil.message);
    const actual = fila && fila.activo ? (fila as UsuarioPortal) : null;
    setPerfil(actual);
    if (actual?.organizacion_id) {
      const [{ data: orgRow }, { data: lista }] = await Promise.all([
        supabase.from("organizaciones").select("*").eq("id", actual.organizacion_id).maybeSingle(),
        supabase
          .from("areas")
          .select("*")
          .eq("organizacion_id", actual.organizacion_id)
          .order("orden")
          .order("nombre"),
      ]);
      const mapped = mapOrg(orgRow as Record<string, unknown> | null);
      setOrg(mapped);
      setAreas((lista ?? []) as AreaOrg[]);
      if (mapped?.color) document.documentElement.style.setProperty("--color-primario", mapped.color);
    } else {
      setOrg(null);
      setAreas([]);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    void recargar();
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_IN" || evento === "SIGNED_OUT") void recargar();
    });
    return () => sub.subscription.unsubscribe();
  }, [recargar]);

  const salir = useCallback(async () => {
    await supabase.auth.signOut({ scope: "local" });
    setSession(null);
    setPerfil(null);
    setOrg(null);
    setAreas([]);
  }, []);

  const valor = useMemo<AppState>(
    () => ({
      session,
      perfil,
      org,
      areas,
      cargando,
      error,
      recargar,
      salir,
      puede: (permiso) => puede(perfil?.rol, permiso),
      rol: perfil?.rol ?? null,
      areasActivas: areas.filter((a) => a.activa),
    }),
    [session, perfil, org, areas, cargando, error, recargar, salir],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
