import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import { listarPreventivo, type RegistroPreventivo } from "../preventivo/preventivoService";
import { esSolicitud, listarCorrectivo, type RegistroCorrectivo } from "../solicitudes/correctivoService";
import { actualizarHoja, obtenerHoja, type HojaVida } from "./hojasService";

function HojaDetallePage() {
  const { id = "" } = useParams();
  const { puede } = useAuth();
  const { areasActivas } = useOrganizacion();
  const [hoja, setHoja] = useState<HojaVida | null>(null);
  const [preventivos, setPreventivos] = useState<RegistroPreventivo[]>([]);
  const [correctivos, setCorrectivos] = useState<RegistroCorrectivo[]>([]);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [area, setArea] = useState("");
  const [frecuencia, setFrecuencia] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const actual = await obtenerHoja(id);
        setHoja(actual);
        if (!actual) return;
        setNombre(actual.nombre);
        setCodigo(actual.codigo ?? "");
        setArea(actual.area);
        setFrecuencia(String(actual.frecuencia_pm_meses ?? ""));
        const [pm, corr] = await Promise.all([
          listarPreventivo(actual.organizacion_id),
          listarCorrectivo(actual.organizacion_id),
        ]);
        setPreventivos(pm.filter((item) => item.hoja_id === actual.id));
        setCorrectivos(
          corr.filter(
            (item) =>
              item.datos.equipo === actual.nombre ||
              item.datos.equipo === actual.codigo ||
              item.area === actual.area,
          ),
        );
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [id]);

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!hoja) return;
    try {
      await actualizarHoja(hoja.id, {
        nombre: nombre.trim(),
        codigo: codigo.trim(),
        area,
        frecuencia_pm_meses: Number(frecuencia) || null,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!hoja) {
    return <p className="mensaje-vacio">{error || "Cargando equipo..."}</p>;
  }

  return (
    <section className="panel">
      <Link to="/app/hojas-de-vida">← Hojas de vida</Link>
      <h1>{hoja.nombre}</h1>
      {error && <p className="aviso">{error}</p>}
      <form className="tarjeta form-grid" onSubmit={(e) => void guardar(e)}>
        <label>
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={!puede("editar.hojas")} />
        </label>
        <label>
          Código
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} disabled={!puede("editar.hojas")} />
        </label>
        <label>
          Área
          <select value={area} onChange={(e) => setArea(e.target.value)} disabled={!puede("editar.hojas")}>
            {areasActivas.map((item) => (
              <option key={item.id} value={item.nombre}>
                {item.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Frecuencia PM (meses)
          <input value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} disabled={!puede("editar.hojas")} />
        </label>
        {puede("editar.hojas") && (
          <div>
            <button className="btn btn--primario" type="submit">
              Guardar
            </button>
          </div>
        )}
      </form>
      <div className="tarjeta">
        <h2>Historial preventivo</h2>
        <ul>
          {preventivos.map((item) => (
            <li key={item.id}>
              {item.fecha} · {item.descripcion || "PM"}
            </li>
          ))}
        </ul>
        {preventivos.length === 0 && <p className="mensaje-vacio">Sin preventivos.</p>}
      </div>
      <div className="tarjeta">
        <h2>Correctivo / solicitudes</h2>
        <ul>
          {correctivos.map((item) => (
            <li key={item.id}>
              {item.fecha} · {esSolicitud(item) ? "Solicitud" : "Correctivo"} · {item.datos.descripcion || "—"}
            </li>
          ))}
        </ul>
        {correctivos.length === 0 && <p className="mensaje-vacio">Sin intervenciones.</p>}
      </div>
    </section>
  );
}

export default HojaDetallePage;
