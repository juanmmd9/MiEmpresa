import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import { listarHojas, type HojaVida } from "../hojas/hojasService";
import {
  crearPreventivo,
  eliminarPreventivo,
  estadoPm,
  listarPreventivo,
  type RegistroPreventivo,
} from "./preventivoService";

function PreventivoPage() {
  const { puede } = useAuth();
  const { organizacion, areasActivas } = useOrganizacion();
  const [registros, setRegistros] = useState<RegistroPreventivo[]>([]);
  const [hojas, setHojas] = useState<HojaVida[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hojaId, setHojaId] = useState("");
  const [area, setArea] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = useState("");

  async function cargar() {
    if (!organizacion) return;
    try {
      const [pm, equipos] = await Promise.all([
        listarPreventivo(organizacion.id),
        listarHojas(organizacion.id),
      ]);
      setRegistros(pm);
      setHojas(equipos);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacion?.id]);

  async function manejarAlta(evento: FormEvent) {
    evento.preventDefault();
    if (!organizacion) return;
    const hoja = hojas.find((h) => h.id === hojaId);
    try {
      await crearPreventivo({
        organizacion_id: organizacion.id,
        hoja_id: hojaId || null,
        personal_id: null,
        area: area || hoja?.area || areasActivas[0]?.nombre || "General",
        fecha,
        descripcion: descripcion.trim(),
        adjunto_url: null,
        datos: {
          estado: "pendiente_aprobacion",
          equipo: hoja?.nombre,
        },
      });
      setDescripcion("");
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="panel">
      <h1>Mantenimiento preventivo</h1>
      <p className="panel__descripcion">Registra la ejecución de PM. El líder o admin aprueba y firma.</p>
      {error && <p className="aviso">{error}</p>}
      {puede("crear.preventivo") && (
        <form className="tarjeta form-grid" onSubmit={(e) => void manejarAlta(e)}>
          <label>
            Equipo
            <select value={hojaId} onChange={(e) => setHojaId(e.target.value)}>
              <option value="">—</option>
              {hojas.map((hoja) => (
                <option key={hoja.id} value={hoja.id}>
                  {hoja.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Área
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Según equipo</option>
              {areasActivas.map((item) => (
                <option key={item.id} value={item.nombre}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label>
            Trabajo realizado
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
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
            {registros.map((item) => (
              <tr key={item.id}>
                <td>{item.fecha}</td>
                <td>{item.area}</td>
                <td>{item.datos.equipo || "—"}</td>
                <td>{item.descripcion}</td>
                <td>
                  <span className={"estado estado--" + estadoPm(item)}>{estadoPm(item)}</span>
                </td>
                <td>
                  {puede("eliminar.registros") && (
                    <button type="button" className="btn btn--peligro" onClick={() => void eliminarPreventivo(item.id).then(cargar)}>
                      Borrar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registros.length === 0 && <p className="mensaje-vacio">Sin registros de preventivo.</p>}
      </div>
    </section>
  );
}

export default PreventivoPage;
