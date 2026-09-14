import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import {
  actualizarCorrectivo,
  crearCorrectivo,
  esSolicitud,
  estadoSolicitud,
  listarCorrectivo,
  type RegistroCorrectivo,
} from "./correctivoService";

function SolicitudesPage() {
  const { perfil, puede } = useAuth();
  const { organizacion, areasActivas } = useOrganizacion();
  const [lista, setLista] = useState<RegistroCorrectivo[]>([]);
  const [area, setArea] = useState("");
  const [equipo, setEquipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!organizacion) return;
    try {
      const data = await listarCorrectivo(organizacion.id);
      setLista(data.filter(esSolicitud));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacion?.id]);

  async function crear(evento: FormEvent) {
    evento.preventDefault();
    if (!organizacion) return;
    try {
      await crearCorrectivo({
        organizacion_id: organizacion.id,
        personal_id: perfil?.personal_id ?? null,
        area: area || areasActivas[0]?.nombre || "General",
        fecha: new Date().toISOString().slice(0, 10),
        datos: {
          tipo: "solicitud",
          estado: "abierta",
          equipo,
          descripcion,
          solicitante: perfil?.nombre || perfil?.usuario,
        },
      });
      setEquipo("");
      setDescripcion("");
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function cambiarEstado(item: RegistroCorrectivo, estado: "en_proceso" | "cerrada") {
    await actualizarCorrectivo(item.id, { datos: { ...item.datos, estado } });
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
              <select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">Selecciona</option>
                {areasActivas.map((item) => (
                  <option key={item.id} value={item.nombre}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Equipo / ubicación
              <input value={equipo} onChange={(e) => setEquipo(e.target.value)} />
            </label>
          </div>
          <label>
            Descripción de la falla
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
          </label>
          <button className="btn btn--primario" type="submit">
            Crear solicitud
          </button>
        </form>
      )}
      <div className="rejilla-cards">
        {lista.map((item) => (
          <article className="tarjeta" key={item.id}>
            <span className={"estado estado--" + estadoSolicitud(item)}>{estadoSolicitud(item)}</span>
            <h2>{item.area}</h2>
            <p>{item.datos.equipo}</p>
            <p>{item.datos.descripcion}</p>
            <p className="panel__descripcion">
              {item.fecha} · {item.datos.solicitante}
            </p>
            <div className="acciones-fila">
              {puede("crear.correctivo") && estadoSolicitud(item) === "abierta" && (
                <button type="button" className="btn" onClick={() => void cambiarEstado(item, "en_proceso")}>
                  Tomar
                </button>
              )}
              {puede("crear.correctivo") && estadoSolicitud(item) !== "cerrada" && (
                <button type="button" className="btn btn--primario" onClick={() => void cambiarEstado(item, "cerrada")}>
                  Cerrar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {lista.length === 0 && <p className="mensaje-vacio">No hay solicitudes.</p>}
    </section>
  );
}

export default SolicitudesPage;
