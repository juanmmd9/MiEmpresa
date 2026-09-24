import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { datosDe } from "../lib/util";
import { useApp } from "../state/AppContext";

export default function InicioPage() {
  const { org, areasActivas } = useApp();
  const [stats, setStats] = useState<Record<string, { pm: number; solicitudes: number }>>({});

  useEffect(() => {
    if (!org) return;
    void (async () => {
      const [{ data: pm }, { data: corr }] = await Promise.all([
        supabase.from("preventivo").select("*").eq("organizacion_id", org.id),
        supabase.from("correctivo").select("*").eq("organizacion_id", org.id),
      ]);
      const mapa: Record<string, { pm: number; solicitudes: number }> = {};
      for (const area of areasActivas) mapa[area.nombre] = { pm: 0, solicitudes: 0 };
      for (const item of (pm ?? []) as { area: string; datos: unknown }[]) {
        if (!mapa[item.area]) mapa[item.area] = { pm: 0, solicitudes: 0 };
        if ((datosDe(item.datos).estado || "pendiente") !== "aprobado") mapa[item.area].pm += 1;
      }
      for (const item of (corr ?? []) as { area: string; datos: unknown }[]) {
        const d = datosDe(item.datos);
        if ((d.tipo || "solicitud") !== "solicitud" || d.estado === "cerrada") continue;
        if (!mapa[item.area]) mapa[item.area] = { pm: 0, solicitudes: 0 };
        mapa[item.area].solicitudes += 1;
      }
      setStats(mapa);
    })();
  }, [org, areasActivas]);

  return (
    <section className="panel">
      <h1>Inicio</h1>
      <p className="panel__descripcion">Tablero de {org?.nombre ?? "tu empresa"}.</p>
      {areasActivas.length === 0 && (
        <p className="aviso">
          Esta empresa aún no tiene áreas. Créalas en <Link to="/app/configuracion">Configuración</Link>.
        </p>
      )}
      <div className="rejilla-cards">
        {areasActivas.map((area) => (
          <article className="tarjeta" key={area.id}>
            <h2>{area.nombre}</h2>
            <p>PM pendientes: {stats[area.nombre]?.pm ?? 0}</p>
            <p>Solicitudes abiertas: {stats[area.nombre]?.solicitudes ?? 0}</p>
            <Link className="btn" to="/app/solicitudes">
              Ver solicitudes
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
