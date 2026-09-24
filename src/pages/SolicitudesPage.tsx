import { useEffect, useState, type FormEvent } from "react";
import SelectArea from "../components/SelectArea";
import { supabase } from "../lib/supabase";
import { datosDe, hoy, texto, throwIf } from "../lib/util";
import { useApp } from "../state/AppContext";

interface Solicitud {
  id: string;
  fecha: string;
  area: string;
  datos: unknown;
}

export default function SolicitudesPage() {
  const { org, perfil, puede } = useApp();
  const [lista, setLista] = useState<Solicitud[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!org) return;
    const { data, error: err } = await supabase
      .from("correctivo")
      .select("*")
      .eq("organizacion_id", org.id)
      .order("fecha", { ascending: false });
    throwIf(err);
    setLista(
      ((data ?? []) as Solicitud[]).filter((i) => texto(datosDe(i.datos).tipo, "solicitud") === "solicitud"),
    );
  }

  useEffect(() => {
    void cargar().catch((e: Error) => setError(e.message));
  }, [org?.id]);

  if (!org) return <p className="aviso">Sin empresa.</p>;

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!org) return;
    const fd = new FormData(evento.currentTarget);
    const { error: err } = await supabase.from("correctivo").insert({
      organizacion_id: org.id,
      area: String(fd.get("area") || "General"),
      fecha: hoy(),
      datos: {
        tipo: "solicitud",
        estado: "abierta",
        equipo: String(fd.get("equipo") || ""),
        descripcion: String(fd.get("descripcion") || ""),
        solicitante: perfil?.nombre || perfil?.usuario,
      },
    });
    if (err) setError(err.message);
    else {
      evento.currentTarget.reset();
      await cargar();
    }
  }

  async function cambiarEstado(id: string, estado: string) {
    const { data } = await supabase.from("correctivo").select("datos").eq("id", id).single();
    await supabase
      .from("correctivo")
      .update({ datos: { ...datosDe(data?.datos), estado } })
      .eq("id", id);
    await cargar();
  }

  return (
    <section className="panel">
      <h1>Solicitudes de correctivo</h1>
      <p className="panel__descripcion">Reporta fallas por área. Mantenimiento toma y cierra la solicitud.</p>
      {error && <p className="aviso">{error}</p>}
      {puede("crear.solicitudes") && (
        <form className="tarjeta form-stack" onSubmit={(e) => void crear(e)}>
          <div className="form-grid">
            <label>
              Área
              <SelectArea />
            </label>
            <label>
              Equipo / ubicación
              <input name="equipo" />
            </label>
          </div>
          <label>
            Descripción de la falla
            <textarea name="descripcion" required />
          </label>
          <button className="btn btn--primario" type="submit">
            Crear solicitud
          </button>
        </form>
      )}
      <div className="rejilla-cards">
        {lista.length === 0 && <p className="mensaje-vacio">No hay solicitudes.</p>}
        {lista.map((i) => {
          const d = datosDe(i.datos);
          const est = texto(d.estado, "abierta");
          return (
            <article className="tarjeta" key={i.id}>
              <span className={`estado estado--${est}`}>{est}</span>
              <h2>{i.area}</h2>
              <p>{texto(d.equipo, "")}</p>
              <p>{texto(d.descripcion, "")}</p>
              <p className="panel__descripcion">
                {i.fecha} · {texto(d.solicitante, "")}
              </p>
              <div className="acciones-fila">
                {puede("crear.correctivo") && est === "abierta" && (
                  <button type="button" className="btn" onClick={() => void cambiarEstado(i.id, "en_proceso")}>
                    Tomar
                  </button>
                )}
                {puede("crear.correctivo") && est !== "cerrada" && (
                  <button
                    type="button"
                    className="btn btn--primario"
                    onClick={() => void cambiarEstado(i.id, "cerrada")}
                  >
                    Cerrar
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
