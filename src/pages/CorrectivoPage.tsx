import { useEffect, useState, type FormEvent } from "react";
import SelectArea from "../components/SelectArea";
import { supabase } from "../lib/supabase";
import { datosDe, hoy, texto, throwIf } from "../lib/util";
import { useApp } from "../state/AppContext";

interface Corr {
  id: string;
  fecha: string;
  area: string;
  datos: unknown;
}

export default function CorrectivoPage() {
  const { org, puede } = useApp();
  const [lista, setLista] = useState<Corr[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!org) return;
    const { data, error: err } = await supabase
      .from("correctivo")
      .select("*")
      .eq("organizacion_id", org.id)
      .order("fecha", { ascending: false });
    throwIf(err);
    setLista(((data ?? []) as Corr[]).filter((i) => datosDe(i.datos).tipo === "historico"));
  }

  useEffect(() => {
    void cargar().catch((e: Error) => setError(e.message));
  }, [org?.id]);

  if (!org) return <p className="aviso">Sin empresa.</p>;

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!org) return;
    const fd = new FormData(evento.currentTarget);
    const intervencion = String(fd.get("intervencion") || "");
    const { error: err } = await supabase.from("correctivo").insert({
      organizacion_id: org.id,
      area: String(fd.get("area") || "General"),
      fecha: hoy(),
      datos: {
        tipo: "historico",
        estado: "cerrada",
        equipo: String(fd.get("equipo") || ""),
        intervencion,
        descripcion: intervencion,
      },
    });
    if (err) setError(err.message);
    else {
      evento.currentTarget.reset();
      await cargar();
    }
  }

  return (
    <section className="panel">
      <h1>Mantenimiento correctivo</h1>
      <p className="panel__descripcion">Historial de intervenciones ya ejecutadas.</p>
      {error && <p className="aviso">{error}</p>}
      {puede("crear.correctivo") && (
        <form className="tarjeta form-stack" onSubmit={(e) => void crear(e)}>
          <div className="form-grid">
            <label>
              Área
              <SelectArea />
            </label>
            <label>
              Equipo
              <input name="equipo" />
            </label>
          </div>
          <label>
            Intervención
            <textarea name="intervencion" required />
          </label>
          <button className="btn btn--primario" type="submit">
            Registrar correctivo
          </button>
        </form>
      )}
      <div className="tabla-wrap tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Área</th>
              <th>Equipo</th>
              <th>Intervención</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td colSpan={4} className="mensaje-vacio">
                  Sin historial correctivo.
                </td>
              </tr>
            )}
            {lista.map((i) => {
              const d = datosDe(i.datos);
              return (
                <tr key={i.id}>
                  <td>{i.fecha}</td>
                  <td>{i.area}</td>
                  <td>{texto(d.equipo)}</td>
                  <td>{texto(d.intervencion, texto(d.descripcion, ""))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
