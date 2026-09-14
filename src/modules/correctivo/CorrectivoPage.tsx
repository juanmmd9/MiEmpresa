import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import {
  crearCorrectivo,
  esSolicitud,
  listarCorrectivo,
  type RegistroCorrectivo,
} from "../solicitudes/correctivoService";

function CorrectivoPage() {
  const { puede } = useAuth();
  const { organizacion, areasActivas } = useOrganizacion();
  const [lista, setLista] = useState<RegistroCorrectivo[]>([]);
  const [area, setArea] = useState("");
  const [equipo, setEquipo] = useState("");
  const [intervencion, setIntervencion] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!organizacion) return;
    try {
      const data = await listarCorrectivo(organizacion.id);
      setLista(data.filter((item) => !esSolicitud(item) || item.datos.tipo === "historico"));
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
        personal_id: null,
        area: area || areasActivas[0]?.nombre || "General",
        fecha: new Date().toISOString().slice(0, 10),
        datos: {
          tipo: "historico",
          estado: "cerrada",
          equipo,
          intervencion,
          descripcion: intervencion,
        },
      });
      setEquipo("");
      setIntervencion("");
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const historico = lista.filter((item) => item.datos.tipo === "historico" || !esSolicitud(item));

  return (
    <section className="panel">
      <h1>Mantenimiento correctivo</h1>
      <p className="panel__descripcion">Historial de intervenciones ya ejecutadas (distinto de la solicitud abierta).</p>
      {error && <p className="aviso">{error}</p>}
      {puede("crear.correctivo") && (
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
              Equipo
              <input value={equipo} onChange={(e) => setEquipo(e.target.value)} />
            </label>
          </div>
          <label>
            Intervención
            <textarea value={intervencion} onChange={(e) => setIntervencion(e.target.value)} required />
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
            {historico.map((item) => (
              <tr key={item.id}>
                <td>{item.fecha}</td>
                <td>{item.area}</td>
                <td>{item.datos.equipo}</td>
                <td>{item.datos.intervencion || item.datos.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {historico.length === 0 && <p className="mensaje-vacio">Sin historial correctivo.</p>}
      </div>
    </section>
  );
}

export default CorrectivoPage;
