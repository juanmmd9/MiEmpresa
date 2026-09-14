import { useEffect, useState, type FormEvent } from "react";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import { listarHojas, type HojaVida } from "../hojas/hojasService";
import { crearCitaCronograma, listarCronograma, type CitaCronograma } from "./preventivoService";
import { useAuth } from "../auth/AuthContext";

function CronogramaPage() {
  const { puede } = useAuth();
  const { organizacion } = useOrganizacion();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.toISOString().slice(0, 7));
  const [citas, setCitas] = useState<CitaCronograma[]>([]);
  const [hojas, setHojas] = useState<HojaVida[]>([]);
  const [hojaId, setHojaId] = useState("");
  const [fecha, setFecha] = useState(hoy.toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!organizacion) return;
    const [anio, mesNum] = mes.split("-").map(Number);
    const desde = `${mes}-01`;
    const ultimo = new Date(anio, mesNum, 0).getDate();
    const hasta = `${mes}-${String(ultimo).padStart(2, "0")}`;
    try {
      const [lista, equipos] = await Promise.all([
        listarCronograma(organizacion.id, desde, hasta),
        listarHojas(organizacion.id),
      ]);
      setCitas(lista);
      setHojas(equipos.filter((h) => h.activa));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacion?.id, mes]);

  async function agregar(evento: FormEvent) {
    evento.preventDefault();
    if (!organizacion || !hojaId) return;
    try {
      await crearCitaCronograma(organizacion.id, hojaId, fecha);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function nombreEquipo(id: string) {
    return hojas.find((h) => h.id === id)?.nombre ?? id;
  }

  return (
    <section className="panel">
      <h1>Cronograma preventivo</h1>
      <label>
        Mes
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
      </label>
      {error && <p className="aviso">{error}</p>}
      {puede("crear.preventivo") && (
        <form className="tarjeta form-grid" onSubmit={(e) => void agregar(e)}>
          <label>
            Equipo
            <select value={hojaId} onChange={(e) => setHojaId(e.target.value)} required>
              <option value="">Selecciona</option>
              {hojas.map((hoja) => (
                <option key={hoja.id} value={hoja.id}>
                  {hoja.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
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
            {citas.map((cita) => (
              <tr key={cita.id}>
                <td>{cita.fecha}</td>
                <td>{nombreEquipo(cita.hoja_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {citas.length === 0 && <p className="mensaje-vacio">Sin citas en este mes.</p>}
      </div>
    </section>
  );
}

export default CronogramaPage;
