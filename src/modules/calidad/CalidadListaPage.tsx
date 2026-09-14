import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import {
  actualizarCalidad,
  crearCalidad,
  eliminarCalidad,
  listarCalidad,
  type RegistroCalidad,
} from "./calidadService";

type TipoCalidad = "no_conformidades" | "acciones_mejora" | "gestion_cambio";

const METAS: Record<
  string,
  { tabla: TipoCalidad; titulo: string; descripcion: string; placeholder: string }
> = {
  nc: {
    tabla: "no_conformidades",
    titulo: "No conformidades",
    descripcion: "Hallazgos, análisis de causa y acciones correctivas (CAPA).",
    placeholder: "Descripción del hallazgo",
  },
  mejora: {
    tabla: "acciones_mejora",
    titulo: "Acciones de mejora",
    descripcion: "Oportunidades de mejora y seguimiento del plan de acción.",
    placeholder: "Oportunidad de mejora",
  },
  cambio: {
    tabla: "gestion_cambio",
    titulo: "Gestión del cambio",
    descripcion: "Cambios de proceso, equipo o sistema con impacto en el SGC.",
    placeholder: "Descripción del cambio",
  },
};

function CalidadListaPage() {
  const { tipo = "nc" } = useParams();
  const meta = METAS[tipo] ?? METAS.nc;
  const { puede } = useAuth();
  const { organizacion, areasActivas } = useOrganizacion();
  const [registros, setRegistros] = useState<RegistroCalidad[]>([]);
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!organizacion) return;
    try {
      setRegistros(await listarCalidad(meta.tabla, organizacion.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacion?.id, meta.tabla]);

  async function crear(evento: FormEvent) {
    evento.preventDefault();
    if (!organizacion) return;
    try {
      await crearCalidad(meta.tabla, organizacion.id, {
        titulo: titulo.trim(),
        area,
        estado: "abierta",
      });
      setTitulo("");
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function cerrar(item: RegistroCalidad) {
    await actualizarCalidad(meta.tabla, item.id, { ...item.datos, estado: "cerrada" });
    await cargar();
  }

  return (
    <section className="panel">
      <Link to="/app/calidad">← Calidad</Link>
      <h1>{meta.titulo}</h1>
      <p className="panel__descripcion">{meta.descripcion}</p>
      {error && <p className="aviso">{error}</p>}
      {puede("crear.calidad") && (
        <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
          <label>
            Título
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={meta.placeholder}
              required
            />
          </label>
          <label>
            Área / proceso
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">General</option>
              {areasActivas.map((item) => (
                <option key={item.id} value={item.nombre}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          <div>
            <button className="btn btn--primario" type="submit">
              Registrar
            </button>
          </div>
        </form>
      )}
      <div className="rejilla-cards">
        {registros.map((item) => (
          <article className="tarjeta" key={item.id}>
            <span className={"estado estado--" + String(item.datos.estado || "abierta")}>
              {String(item.datos.estado || "abierta")}
            </span>
            <h2>
              #{item.numero} · {String(item.datos.titulo || "Sin título")}
            </h2>
            <p className="panel__descripcion">{String(item.datos.area || "General")}</p>
            <div className="acciones-fila">
              {puede("crear.calidad") && String(item.datos.estado) !== "cerrada" && (
                <button type="button" className="btn" onClick={() => void cerrar(item)}>
                  Cerrar
                </button>
              )}
              {puede("eliminar.registros") && (
                <button
                  type="button"
                  className="btn btn--peligro"
                  onClick={() => void eliminarCalidad(meta.tabla, item.id).then(cargar)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {registros.length === 0 && <p className="mensaje-vacio">Sin registros.</p>}
    </section>
  );
}

export default CalidadListaPage;
