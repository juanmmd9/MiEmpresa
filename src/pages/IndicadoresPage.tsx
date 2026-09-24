import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { datosDe, periodoMes } from "../lib/util";
import { useApp } from "../state/AppContext";

export default function IndicadoresPage() {
  const { org, areasActivas, puede } = useApp();
  const periodo = periodoMes();
  const [pmMes, setPmMes] = useState(0);
  const [abiertas, setAbiertas] = useState(0);
  const [ncAbiertas, setNcAbiertas] = useState(0);
  const [mapa, setMapa] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function cargar() {
    if (!org) return;
    const [{ data: pm }, { data: corr }, { data: nc }, { data: horas }] = await Promise.all([
      supabase.from("preventivo").select("fecha").eq("organizacion_id", org.id),
      supabase.from("correctivo").select("datos").eq("organizacion_id", org.id),
      supabase.from("no_conformidades").select("datos").eq("organizacion_id", org.id),
      supabase.from("horas_programadas").select("*").eq("organizacion_id", org.id).eq("periodo", periodo),
    ]);
    setPmMes((pm ?? []).filter((i: { fecha: string }) => i.fecha.startsWith(periodo)).length);
    setAbiertas(
      (corr ?? []).filter((i: { datos: unknown }) => {
        const d = datosDe(i.datos);
        return (d.tipo || "solicitud") === "solicitud" && d.estado !== "cerrada";
      }).length,
    );
    setNcAbiertas(
      (nc ?? []).filter((i: { datos: unknown }) => (datosDe(i.datos).estado || "abierta") !== "cerrada").length,
    );
    setMapa(
      Object.fromEntries((horas ?? []).map((h: { area: string; horas: number }) => [h.area, h.horas])),
    );
  }

  useEffect(() => {
    void cargar().catch((e: Error) => setError(e.message));
  }, [org?.id]);

  if (!org) return <p className="aviso">Sin empresa.</p>;

  const total = Object.values(mapa).reduce((a, v) => a + Number(v || 0), 0);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!org) return;
    const fd = new FormData(evento.currentTarget);
    await Promise.all(
      areasActivas.map((a) =>
        supabase.from("horas_programadas").upsert(
          {
            organizacion_id: org.id,
            periodo,
            area: a.nombre,
            horas: Number(fd.get(`hora-${a.nombre}`)) || 0,
          },
          { onConflict: "organizacion_id,periodo,area" },
        ),
      ),
    );
    setOk("Horas guardadas.");
    await cargar();
  }

  return (
    <section className="panel">
      <h1>Indicadores</h1>
      <p className="panel__descripcion">Periodo {periodo}.</p>
      {error && <p className="aviso">{error}</p>}
      {ok && <p className="mensaje-vacio">{ok}</p>}
      <div className="rejilla-cards">
        <article className="tarjeta kpi">
          <span>PM del mes</span>
          <strong>{pmMes}</strong>
        </article>
        <article className="tarjeta kpi">
          <span>Horas programadas</span>
          <strong>{total}</strong>
        </article>
        <article className="tarjeta kpi">
          <span>Solicitudes abiertas</span>
          <strong>{abiertas}</strong>
        </article>
        <article className="tarjeta kpi">
          <span>No conformidades abiertas</span>
          <strong>{ncAbiertas}</strong>
        </article>
      </div>
      {puede("editar.indicadores") && (
        <form className="tarjeta form-stack" onSubmit={(e) => void guardar(e)}>
          <h2>Horas programadas por área</h2>
          <div className="form-grid">
            {areasActivas.map((a) => (
              <label key={a.id}>
                {a.nombre}
                <input type="number" min={0} name={`hora-${a.nombre}`} defaultValue={mapa[a.nombre] ?? ""} />
              </label>
            ))}
          </div>
          <button className="btn btn--primario" type="submit">
            Guardar horas
          </button>
        </form>
      )}
    </section>
  );
}
