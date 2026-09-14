import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import { listarCalidad } from "./calidadService";

function CalidadPage() {
  const { organizacion } = useOrganizacion();
  const [conteos, setConteos] = useState({ nc: 0, mejora: 0, cambio: 0 });

  useEffect(() => {
    if (!organizacion) return;
    void (async () => {
      const [nc, mejora, cambio] = await Promise.all([
        listarCalidad("no_conformidades", organizacion.id),
        listarCalidad("acciones_mejora", organizacion.id),
        listarCalidad("gestion_cambio", organizacion.id),
      ]);
      setConteos({ nc: nc.length, mejora: mejora.length, cambio: cambio.length });
    })();
  }, [organizacion]);

  return (
    <section className="panel">
      <h1>Calidad</h1>
      <p className="panel__descripcion">
        Módulos SGC genéricos. Cada empresa usa sus procesos; no hay códigos de formato de una sola planta.
      </p>
      <div className="rejilla-cards">
        <article className="tarjeta">
          <h2>No conformidades</h2>
          <p>{conteos.nc} registros</p>
          <Link className="btn btn--primario" to="/app/calidad/nc">
            Abrir
          </Link>
        </article>
        <article className="tarjeta">
          <h2>Acciones de mejora</h2>
          <p>{conteos.mejora} registros</p>
          <Link className="btn btn--primario" to="/app/calidad/mejora">
            Abrir
          </Link>
        </article>
        <article className="tarjeta">
          <h2>Gestión del cambio</h2>
          <p>{conteos.cambio} registros</p>
          <Link className="btn btn--primario" to="/app/calidad/cambio">
            Abrir
          </Link>
        </article>
      </div>
    </section>
  );
}

export default CalidadPage;
