import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import SelectArea from "../components/SelectArea";
import { supabase } from "../lib/supabase";
import { throwIf } from "../lib/util";
import { useApp } from "../state/AppContext";

interface Persona {
  id: string;
  nombre: string;
  cargo: string | null;
  area: string | null;
  activo: boolean;
}

export default function PersonalPage() {
  const { org, puede } = useApp();
  const [lista, setLista] = useState<Persona[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!org) return;
    const { data, error: err } = await supabase
      .from("personal")
      .select("*")
      .eq("organizacion_id", org.id)
      .order("nombre");
    throwIf(err);
    setLista((data ?? []) as Persona[]);
  }

  useEffect(() => {
    void cargar().catch((e: Error) => setError(e.message));
  }, [org?.id]);

  if (!org) return <p className="aviso">Sin empresa.</p>;

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!org) return;
    const fd = new FormData(evento.currentTarget);
    const { error: err } = await supabase.from("personal").insert({
      organizacion_id: org.id,
      nombre: String(fd.get("nombre") || "").trim(),
      cargo: String(fd.get("cargo") || "") || null,
      area: String(fd.get("area") || "") || null,
    });
    if (err) setError(err.message);
    else {
      evento.currentTarget.reset();
      await cargar();
    }
  }

  return (
    <section className="panel">
      <div className="panel__cabecera">
        <div>
          <h1>Personal</h1>
          <p className="panel__descripcion">Directorio de la empresa.</p>
        </div>
        {puede("gestionar.usuarios") && (
          <Link className="btn" to="/app/personal/usuarios">
            Usuarios del portal
          </Link>
        )}
      </div>
      {error && <p className="aviso">{error}</p>}
      {puede("editar.personal") && (
        <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
          <label>
            Nombre
            <input name="nombre" required />
          </label>
          <label>
            Cargo
            <input name="cargo" />
          </label>
          <label>
            Área
            <SelectArea />
          </label>
          <div>
            <button className="btn btn--primario" type="submit">
              Agregar
            </button>
          </div>
        </form>
      )}
      <div className="tabla-wrap tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Área</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td colSpan={4} className="mensaje-vacio">
                  Sin personal.
                </td>
              </tr>
            )}
            {lista.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.cargo}</td>
                <td>{p.area}</td>
                <td>
                  {puede("editar.personal") ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        void supabase
                          .from("personal")
                          .update({ activo: !p.activo })
                          .eq("id", p.id)
                          .then(() => cargar())
                      }
                    >
                      {p.activo ? "Activo" : "Inactivo"}
                    </button>
                  ) : p.activo ? (
                    "Activo"
                  ) : (
                    "Inactivo"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
