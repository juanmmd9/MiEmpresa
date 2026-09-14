import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import { listarPreventivo } from "../preventivo/preventivoService";
import { esSolicitud, estadoSolicitud, listarCorrectivo } from "../solicitudes/correctivoService";
import { listarCalidad, guardarHorasProgramadas, listarHorasProgramadas } from "../calidad/calidadService";

function IndicadoresPage() {
  const { puede } = useAuth();
  const { organizacion, areasActivas } = useOrganizacion();
  const periodo = new Date().toISOString().slice(0, 7);
  const [pmMes, setPmMes] = useState(0);
  const [solicitudesAbiertas, setSolicitudesAbiertas] = useState(0);
  const [ncAbiertas, setNcAbiertas] = useState(0);
  const [horas, setHoras] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizacion) return;
    void (async () => {
      try {
        const [pm, corr, nc, programadas] = await Promise.all([
          listarPreventivo(organizacion.id),
          listarCorrectivo(organizacion.id),
          listarCalidad("no_conformidades", organizacion.id),
          listarHorasProgramadas(organizacion.id, periodo),
        ]);
        setPmMes(pm.filter((item) => item.fecha.startsWith(periodo)).length);
        setSolicitudesAbiertas(
          corr.filter((item) => esSolicitud(item) && estadoSolicitud(item) !== "cerrada").length,
        );
        setNcAbiertas(nc.filter((item) => String(item.datos.estado || "abierta") !== "cerrada").length);
        const mapa: Record<string, string> = {};
        for (const fila of programadas) mapa[fila.area] = String(fila.horas);
        setHoras(mapa);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [organizacion, periodo]);

  const totalHoras = useMemo(
    () => Object.values(horas).reduce((acc, v) => acc + (Number(v) || 0), 0),
    [horas],
  );

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!organizacion) return;
    try {
      await Promise.all(
        areasActivas.map((area) =>
          guardarHorasProgramadas(organizacion.id, periodo, area.nombre, Number(horas[area.nombre]) || 0),
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="panel">
      <h1>Indicadores</h1>
      <p className="panel__descripcion">Periodo {periodo}. Cumplimiento de PM, solicitudes abiertas y NC.</p>
      {error && <p className="aviso">{error}</p>}
      <div className="rejilla-cards">
        <article className="tarjeta kpi">
          <span>PM del mes</span>
          <strong>{pmMes}</strong>
        </article>
        <article className="tarjeta kpi">
          <span>Horas programadas</span>
          <strong>{totalHoras}</strong>
        </article>
        <article className="tarjeta kpi">
          <span>Solicitudes abiertas</span>
          <strong>{solicitudesAbiertas}</strong>
        </article>
        <article className="tarjeta kpi">
          <span>No conformidades abiertas</span>
          <strong>{ncAbiertas}</strong>
        </article>
      </div>
      {puede("editar.indicadores") && (
        <form className="tarjeta form-stack" onSubmit={(e) => void guardar(e)}>
          <h2>Horas programadas por área</h2>
          <div className="form-grid">
            {areasActivas.map((area) => (
              <label key={area.id}>
                {area.nombre}
                <input
                  type="number"
                  min={0}
                  value={horas[area.nombre] ?? ""}
                  onChange={(e) => setHoras((prev) => ({ ...prev, [area.nombre]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <button className="btn btn--primario" type="submit">
            Guardar horas
          </button>
        </form>
      )}
    </section>
  );
}

export default IndicadoresPage;
