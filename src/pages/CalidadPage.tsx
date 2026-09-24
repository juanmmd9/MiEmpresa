import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import SelectArea from "../components/SelectArea";
import { supabase } from "../lib/supabase";
import { datosDe, texto, throwIf } from "../lib/util";
import { useApp } from "../state/AppContext";

const METAS = {
  nc: {
    tabla: "no_conformidades",
    titulo: "No conformidades",
    desc: "Hallazgos, análisis de causa y acciones correctivas (CAPA).",
  },
  mejora: {
    tabla: "acciones_mejora",
    titulo: "Acciones de mejora",
    desc: "Oportunidades de mejora y seguimiento del plan.",
  },
  cambio: {
    tabla: "gestion_cambio",
    titulo: "Gestión del cambio",
    desc: "Cambios de proceso, equipo o sistema con impacto en el SGC.",
  },
} as const;

type TipoCalidad = keyof typeof METAS;

interface Registro {
  id: string;
  numero: number | null;
  datos: unknown;
}

export default function CalidadPage() {
  const { tipo } = useParams();
  if (tipo && tipo in METAS) return <CalidadLista tipo={tipo as TipoCalidad} />;
  return <CalidadInicio />;
}

function CalidadInicio() {
  const { org } = useApp();
  const [conteos, setConteos] = useState({ nc: 0, mejora: 0, cambio: 0 });

  useEffect(() => {
    if (!org) return;
    void (async () => {
      const [nc, mejora, cambio] = await Promise.all([
        supabase.from("no_conformidades").select("id", { count: "exact", head: true }).eq("organizacion_id", org.id),
        supabase.from("acciones_mejora").select("id", { count: "exact", head: true }).eq("organizacion_id", org.id),
        supabase.from("gestion_cambio").select("id", { count: "exact", head: true }).eq("organizacion_id", org.id),
      ]);
      setConteos({ nc: nc.count ?? 0, mejora: mejora.count ?? 0, cambio: cambio.count ?? 0 });
    })();
  }, [org?.id]);

  if (!org) return <p className="aviso">Sin empresa.</p>;

  return (
    <section className="panel">
      <h1>Calidad</h1>
      <p className="panel__descripcion">Módulos SGC genéricos. Cada empresa usa sus procesos.</p>
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

function CalidadLista({ tipo }: { tipo: TipoCalidad }) {
  const { org, puede } = useApp();
  const meta = METAS[tipo];
  const [lista, setLista] = useState<Registro[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!org) return;
    const { data, error: err } = await supabase
      .from(meta.tabla)
      .select("*")
      .eq("organizacion_id", org.id)
      .order("numero", { ascending: false });
    throwIf(err);
    setLista((data ?? []) as Registro[]);
  }

  useEffect(() => {
    void cargar().catch((e: Error) => setError(e.message));
  }, [org?.id, tipo]);

  if (!org) return <p className="aviso">Sin empresa.</p>;

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!org) return;
    const fd = new FormData(evento.currentTarget);
    const { error: err } = await supabase.from(meta.tabla).insert({
      organizacion_id: org.id,
      datos: { titulo: String(fd.get("titulo") || "").trim(), area: String(fd.get("area") || ""), estado: "abierta" },
    });
    if (err) setError(err.message);
    else {
      evento.currentTarget.reset();
      await cargar();
    }
  }

  async function cerrar(id: string) {
    const { data } = await supabase.from(meta.tabla).select("datos").eq("id", id).single();
    await supabase
      .from(meta.tabla)
      .update({ datos: { ...datosDe(data?.datos), estado: "cerrada" } })
      .eq("id", id);
    await cargar();
  }

  return (
    <section className="panel">
      <Link to="/app/calidad">← Calidad</Link>
      <h1>{meta.titulo}</h1>
      <p className="panel__descripcion">{meta.desc}</p>
      {error && <p className="aviso">{error}</p>}
      {puede("crear.calidad") && (
        <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
          <label>
            Título
            <input name="titulo" required />
          </label>
          <label>
            Área / proceso
            <SelectArea incluirGeneral />
          </label>
          <div>
            <button className="btn btn--primario" type="submit">
              Registrar
            </button>
          </div>
        </form>
      )}
      <div className="rejilla-cards">
        {lista.length === 0 && <p className="mensaje-vacio">Sin registros.</p>}
        {lista.map((i) => {
          const d = datosDe(i.datos);
          const estado = texto(d.estado, "abierta");
          return (
            <article className="tarjeta" key={i.id}>
              <span className={`estado estado--${estado}`}>{estado}</span>
              <h2>
                #{i.numero} · {texto(d.titulo, "Sin título")}
              </h2>
              <p className="panel__descripcion">{texto(d.area, "General")}</p>
              <div className="acciones-fila">
                {puede("crear.calidad") && estado !== "cerrada" && (
                  <button type="button" className="btn" onClick={() => void cerrar(i.id)}>
                    Cerrar
                  </button>
                )}
                {puede("eliminar.registros") && (
                  <button
                    type="button"
                    className="btn btn--peligro"
                    onClick={() => void supabase.from(meta.tabla).delete().eq("id", i.id).then(() => cargar())}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
