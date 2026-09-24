import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import SelectArea from "../components/SelectArea";
import { supabase } from "../lib/supabase";
import { datosDe, texto, throwIf } from "../lib/util";
import { useApp } from "../state/AppContext";

interface Hoja {
  id: string;
  nombre: string;
  codigo: string | null;
  area: string;
  frecuencia_pm_meses: number | null;
}

export default function HojasPage() {
  const { id } = useParams();
  if (id) return <HojaDetalle id={id} />;
  return <HojasLista />;
}

function HojasLista() {
  const { org, puede } = useApp();
  const [lista, setLista] = useState<Hoja[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!org) return;
    const { data, error: err } = await supabase
      .from("hojas_vida")
      .select("*")
      .eq("organizacion_id", org.id)
      .order("nombre");
    throwIf(err);
    setLista((data ?? []) as Hoja[]);
  }

  useEffect(() => {
    void cargar().catch((e: Error) => setError(e.message));
  }, [org?.id]);

  if (!org) return <p className="aviso">Sin empresa.</p>;

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!org) return;
    const fd = new FormData(evento.currentTarget);
    const { error: err } = await supabase.from("hojas_vida").insert({
      organizacion_id: org.id,
      nombre: String(fd.get("nombre") || "").trim(),
      codigo: String(fd.get("codigo") || "") || null,
      area: String(fd.get("area") || "General"),
      frecuencia_pm_meses: Number(fd.get("frecuencia")) || null,
    });
    if (err) setError(err.message);
    else {
      evento.currentTarget.reset();
      await cargar();
    }
  }

  return (
    <section className="panel">
      <h1>Hojas de vida</h1>
      <p className="panel__descripcion">Equipos y máquinas de {org.nombre}.</p>
      {error && <p className="aviso">{error}</p>}
      {puede("editar.hojas") && (
        <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
          <label>
            Nombre
            <input name="nombre" required />
          </label>
          <label>
            Código
            <input name="codigo" />
          </label>
          <label>
            Área
            <SelectArea />
          </label>
          <label>
            Frecuencia PM (meses)
            <input name="frecuencia" type="number" min={1} defaultValue={1} />
          </label>
          <div>
            <button className="btn btn--primario" type="submit">
              Agregar equipo
            </button>
          </div>
        </form>
      )}
      <div className="rejilla-cards">
        {lista.length === 0 && <p className="mensaje-vacio">Aún no hay equipos.</p>}
        {lista.map((h) => (
          <article className="tarjeta" key={h.id}>
            <h2>{h.nombre}</h2>
            <p className="panel__descripcion">
              {h.codigo || "Sin código"} · {h.area}
            </p>
            <p>PM cada {h.frecuencia_pm_meses ?? "—"} mes(es)</p>
            <div className="acciones-fila">
              <Link className="btn" to={`/app/hojas-de-vida/${h.id}`}>
                Abrir
              </Link>
              {puede("eliminar.registros") && (
                <button
                  type="button"
                  className="btn btn--peligro"
                  onClick={() =>
                    void supabase
                      .from("hojas_vida")
                      .delete()
                      .eq("id", h.id)
                      .then(() => cargar())
                  }
                >
                  Eliminar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HojaDetalle({ id }: { id: string }) {
  const { org, puede } = useApp();
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const [pm, setPm] = useState<{ fecha: string; descripcion: string | null }[]>([]);
  const [corr, setCorr] = useState<{ fecha: string; area: string; datos: unknown }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!org) return;
    void (async () => {
      const { data, error: err } = await supabase.from("hojas_vida").select("*").eq("id", id).maybeSingle();
      throwIf(err);
      setHoja(data as Hoja | null);
      if (!data) return;
      const [{ data: listaPm }, { data: listaCorr }] = await Promise.all([
        supabase.from("preventivo").select("*").eq("hoja_id", id).order("fecha", { ascending: false }),
        supabase.from("correctivo").select("*").eq("organizacion_id", org.id).order("fecha", { ascending: false }),
      ]);
      setPm((listaPm ?? []) as { fecha: string; descripcion: string | null }[]);
      setCorr((listaCorr ?? []) as { fecha: string; area: string; datos: unknown }[]);
    })().catch((e: Error) => setError(e.message));
  }, [id, org?.id]);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const fd = new FormData(evento.currentTarget);
    const { error: err } = await supabase
      .from("hojas_vida")
      .update({
        nombre: String(fd.get("nombre") || "").trim(),
        codigo: String(fd.get("codigo") || ""),
        area: String(fd.get("area") || ""),
        frecuencia_pm_meses: Number(fd.get("frecuencia")) || null,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", id);
    if (err) setError(err.message);
    else setOk("Equipo actualizado.");
  }

  if (!org) return <p className="aviso">Sin empresa.</p>;
  if (error) return <p className="aviso">{error}</p>;
  if (!hoja) return <p className="mensaje-vacio">Equipo no encontrado.</p>;

  const historialCorr = corr.filter((i) => texto(datosDe(i.datos).equipo, "") === hoja.nombre || i.area === hoja.area);

  return (
    <section className="panel">
      <Link to="/app/hojas-de-vida">← Hojas de vida</Link>
      <h1>{hoja.nombre}</h1>
      {ok && <p className="mensaje-vacio">{ok}</p>}
      <form className="tarjeta form-grid" onSubmit={(e) => void guardar(e)}>
        <label>
          Nombre
          <input name="nombre" defaultValue={hoja.nombre} />
        </label>
        <label>
          Código
          <input name="codigo" defaultValue={hoja.codigo || ""} />
        </label>
        <label>
          Área
          <SelectArea valor={hoja.area} />
        </label>
        <label>
          Frecuencia PM (meses)
          <input name="frecuencia" defaultValue={hoja.frecuencia_pm_meses || ""} />
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
        {pm.length === 0 ? (
          <p className="mensaje-vacio">Sin preventivos.</p>
        ) : (
          <ul>
            {pm.map((i, idx) => (
              <li key={idx}>
                {i.fecha} · {i.descripcion || "PM"}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="tarjeta">
        <h2>Correctivo</h2>
        {historialCorr.length === 0 ? (
          <p className="mensaje-vacio">Sin intervenciones.</p>
        ) : (
          <ul>
            {historialCorr.map((i, idx) => (
              <li key={idx}>
                {i.fecha} · {texto(datosDe(i.datos).descripcion, "")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
