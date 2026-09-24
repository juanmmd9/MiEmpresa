import { useEffect, useState, type FormEvent } from "react";
import SelectArea from "../components/SelectArea";
import { supabase } from "../lib/supabase";
import { datosDe, hoy, texto, throwIf } from "../lib/util";
import { useApp } from "../state/AppContext";

interface Pm {
  id: string;
  fecha: string;
  area: string;
  descripcion: string | null;
  hoja_id: string | null;
  datos: unknown;
}

interface Equipo {
  id: string;
  nombre: string;
  area: string;
}

export default function PreventivoPage() {
  const { org, puede } = useApp();
  const [lista, setLista] = useState<Pm[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!org) return;
    const { data, error: err } = await supabase
      .from("preventivo")
      .select("*")
      .eq("organizacion_id", org.id)
      .order("fecha", { ascending: false });
    throwIf(err);
    const { data: hojas } = await supabase
      .from("hojas_vida")
      .select("id,nombre,area")
      .eq("organizacion_id", org.id)
      .order("nombre");
    setLista((data ?? []) as Pm[]);
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
    const hojaId = String(fd.get("hoja_id") || "") || null;
    const equipo = equipos.find((e) => e.id === hojaId);
    const { error: err } = await supabase.from("preventivo").insert({
      organizacion_id: org.id,
      hoja_id: hojaId,
      area: String(fd.get("area") || "") || equipo?.area || "General",
      fecha: String(fd.get("fecha") || hoy()),
      descripcion: String(fd.get("descripcion") || "").trim(),
      datos: { estado: "pendiente_aprobacion", equipo: equipo?.nombre || "" },
    });
    if (err) setError(err.message);
    else {
      evento.currentTarget.reset();
      await cargar();
    }
  }

  return (
    <section className="panel">
      <h1>Mantenimiento preventivo</h1>
      <p className="panel__descripcion">Registra la ejecución de PM. El líder o admin aprueba.</p>
      {error && <p className="aviso">{error}</p>}
      {puede("crear.preventivo") && (
        <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
          <label>
            Equipo
            <select name="hoja_id">
              <option value="">—</option>
              {equipos.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Área
            <SelectArea />
          </label>
          <label>
            Fecha
            <input type="date" name="fecha" defaultValue={hoy()} />
          </label>
          <label>
            Trabajo realizado
            <input name="descripcion" required />
          </label>
          <div>
            <button className="btn btn--primario" type="submit">
              Registrar PM
            </button>
          </div>
        </form>
      )}
      <div className="tabla-wrap tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Área</th>
              <th>Equipo</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className="mensaje-vacio">
                  Sin registros de preventivo.
                </td>
              </tr>
            )}
            {lista.map((i) => {
              const d = datosDe(i.datos);
              const estado = texto(d.estado, "pendiente");
              return (
                <tr key={i.id}>
                  <td>{i.fecha}</td>
                  <td>{i.area}</td>
                  <td>{texto(d.equipo)}</td>
                  <td>{i.descripcion}</td>
                  <td>
                    <span className={`estado estado--${estado}`}>{estado}</span>
                  </td>
                  <td>
                    {puede("eliminar.registros") && (
                      <button
                        type="button"
                        className="btn btn--peligro"
                        onClick={() =>
                          void supabase
                            .from("preventivo")
                            .delete()
                            .eq("id", i.id)
                            .then(() => cargar())
                        }
                      >
                        Borrar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
