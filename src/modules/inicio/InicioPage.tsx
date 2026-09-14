import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import { estadoPm, listarPreventivo } from "../preventivo/preventivoService";
import { esSolicitud, estadoSolicitud, listarCorrectivo } from "../solicitudes/correctivoService";

function InicioPage() {
  const { organizacion, areasActivas, moduloEncendido } = useOrganizacion();
  const [stats, setStats] = useState<Record<string, { pm: number; solicitudes: number }>>({});

  useEffect(() => {
    if (!organizacion || !moduloEncendido("mantenimiento")) return;
    void (async () => {
      const [pm, corr] = await Promise.all([
        listarPreventivo(organizacion.id),
        listarCorrectivo(organizacion.id),
      ]);
      const mapa: Record<string, { pm: number; solicitudes: number }> = {};
      for (const area of areasActivas) mapa[area.nombre] = { pm: 0, solicitudes: 0 };
      for (const item of pm) {
        if (!mapa[item.area]) mapa[item.area] = { pm: 0, solicitudes: 0 };
        if (estadoPm(item) !== "aprobado") mapa[item.area].pm += 1;
      }
      for (const item of corr) {
        if (!esSolicitud(item) || estadoSolicitud(item) === "cerrada") continue;
        if (!mapa[item.area]) mapa[item.area] = { pm: 0, solicitudes: 0 };
        mapa[item.area].solicitudes += 1;
      }
      setStats(mapa);
    })();
  }, [organizacion, areasActivas, moduloEncendido]);

  return (
    <section className="panel">
      <h1>Inicio</h1>
      <p className="panel__descripcion">
        Tablero de {organizacion?.nombre ?? "tu empresa"}. Las áreas se configuran por cliente; no están fijas.
      </p>
      {areasActivas.length === 0 && (
        <p className="aviso">
          Esta empresa aún no tiene áreas. Un administrador puede crearlas en{" "}
          <Link to="/app/configuracion">Configuración</Link>.
        </p>
      )}
      <div className="rejilla-cards">
        {areasActivas.map((area) => (
          <article className="tarjeta" key={area.id}>
            <h2>{area.nombre}</h2>
            <p>PM pendientes: {stats[area.nombre]?.pm ?? 0}</p>
            <p>Solicitudes abiertas: {stats[area.nombre]?.solicitudes ?? 0}</p>
            {area.tiene_preventivo ? <p>Incluye preventivo</p> : <p>Solo correctivo</p>}
            <Link className="btn" to="/app/solicitudes">
              Ver solicitudes
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default InicioPage;
