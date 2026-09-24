import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { datosDe, texto, throwIf } from "../lib/util";
import { useApp } from "../state/AppContext";

interface Pm {
  id: string;
  fecha: string;
  area: string;
  descripcion: string | null;
  datos: unknown;
}

export default function AprobacionPage() {
  const { org, puede } = useApp();
  const [lista, setLista] = useState<Pm[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!org) return;
    const { data, error: err } = await supabase.from("preventivo").select("*").eq("organizacion_id", org.id);
    throwIf(err);
    setLista(
      ((data ?? []) as Pm[]).filter((i) => texto(datosDe(i.datos).estado, "") === "pendiente_aprobacion"),
    );
  }

  useEffect(() => {
    void cargar().catch((e: Error) => setError(e.message));
  }, [org?.id]);

  if (!org) return <p className="aviso">Sin empresa.</p>;

  async function aprobar(id: string) {
    const { data } = await supabase.from("preventivo").select("datos").eq("id", id).single();
    await supabase
      .from("preventivo")
      .update({ datos: { ...datosDe(data?.datos), estado: "aprobado", firma: true } })
      .eq("id", id);
    await cargar();
  }

  return (
    <section className="panel">
      <h1>Aprobar preventivo</h1>
      <p className="panel__descripcion">PM pendientes de firma del líder o administrador.</p>
      {error && <p className="aviso">{error}</p>}
      <div className="rejilla-cards">
        {lista.length === 0 && <p className="mensaje-vacio">No hay PM pendientes de aprobación.</p>}
        {lista.map((i) => (
          <article className="tarjeta" key={i.id}>
            <h2>{texto(datosDe(i.datos).equipo, i.area)}</h2>
            <p>
              {i.fecha} · {i.descripcion}
            </p>
            {puede("aprobar.preventivo") && (
              <button type="button" className="btn btn--primario" onClick={() => void aprobar(i.id)}>
                Aprobar y firmar
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
