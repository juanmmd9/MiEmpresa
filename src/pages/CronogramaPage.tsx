import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { hoy, periodoMes } from "../lib/util";
import { useApp } from "../state/AppContext";

interface Cita {
  id: string;
  fecha: string;
  hoja_id: string;
}

interface Equipo {
  id: string;
  nombre: string;
}

export default function CronogramaPage() {
  const { org, puede } = useApp();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mes = periodoMes();

  async function cargar() {
    if (!org) return;
    const [anio, mesNum] = mes.split("-").map(Number);
    const desde = `${mes}-01`;
    const ultimo = new Date(anio, mesNum, 0).getDate();
    const hasta = `${mes}-${String(ultimo).padStart(2, "0")}`;
    const [{ data: lista }, { data: hojas }] = await Promise.all([
      supabase
        .from("cronograma")
        .select("*")
        .eq("organizacion_id", org.id)
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("fecha"),
      supabase.from("hojas_vida").select("id,nombre").eq("organizacion_id", org.id).eq("activa", true),
    ]);
    setCitas((lista ?? []) as Cita[]);
    setEquipos((hojas ?? []) as Equipo[]);
  }

  useEffect(() => {
    void cargar().catch((e: Error) => setError(e.message));
  }, [org?.id]);

  if (!org) return <p className="aviso">Sin empresa.</p>;

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!org) return;
    const fd = new FormData(evento.currentTarget);
    const { error: err } = await supabase.from("cronograma").insert({
      organizacion_id: org.id,
      hoja_id: String(fd.get("hoja_id")),
      fecha: String(fd.get("fecha") || hoy()),
    });
    if (err) setError(err.message);
    else {
      evento.currentTarget.reset();
      await cargar();
    }
  }

  const nombre = (id: string) => equipos.find((h) => h.id === id)?.nombre || id;

  return (
    <section className="panel">
      <h1>Cronograma preventivo</h1>
      {error && <p className="aviso">{error}</p>}
      {puede("crear.preventivo") && (
        <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
          <label>
            Equipo
            <select name="hoja_id" required>
              {equipos.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input type="date" name="fecha" defaultValue={hoy()} />
          </label>
          <div>
            <button className="btn btn--primario" type="submit">
              Agregar cita
            </button>
          </div>
        </form>
      )}
      <div className="tabla-wrap tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Equipo</th>
            </tr>
          </thead>
          <tbody>
            {citas.length === 0 && (
              <tr>
                <td colSpan={2} className="mensaje-vacio">
                  Sin citas en este mes.
                </td>
              </tr>
            )}
            {citas.map((c) => (
              <tr key={c.id}>
                <td>{c.fecha}</td>
                <td>{nombre(c.hoja_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
