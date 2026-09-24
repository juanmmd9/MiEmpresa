import { useEffect, useState, type FormEvent } from "react";
import SelectArea from "../components/SelectArea";
import { etiquetaRol, ROLES_EMPRESA, type RolPortal } from "../lib/roles";
import { supabase } from "../lib/supabase";
import { throwIf } from "../lib/util";
import { useApp } from "../state/AppContext";

interface UsuarioFila {
  id: string;
  usuario: string;
  nombre: string;
  rol: RolPortal;
  area: string | null;
  activo: boolean;
}

export default function UsuariosPage() {
  const { org, puede } = useApp();
  const [lista, setLista] = useState<UsuarioFila[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!org) return;
    const { data, error: err } = await supabase
      .from("usuarios_portal")
      .select("*")
      .eq("organizacion_id", org.id)
      .order("nombre");
    throwIf(err);
    setLista((data ?? []) as UsuarioFila[]);
  }

  useEffect(() => {
    void cargar().catch((e: Error) => setError(e.message));
  }, [org?.id]);

  if (!puede("gestionar.usuarios") || !org) {
    return <p className="aviso">No tienes permiso para gestionar usuarios.</p>;
  }

  const empresa = org;

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const fd = new FormData(evento.currentTarget);
    const { error: fnError, data } = await supabase.functions.invoke("crear-usuario", {
      body: {
        organizacion_id: empresa.id,
        slug: empresa.slug,
        usuario: String(fd.get("usuario") || ""),
        nombre: String(fd.get("nombre") || ""),
        password: String(fd.get("password") || ""),
        rol: String(fd.get("rol") || "operador"),
        area: String(fd.get("area") || "") || null,
      },
    });
    if (fnError) {
      setError("Despliega la Edge Function crear-usuario. " + fnError.message);
      return;
    }
    if (data && typeof data === "object" && "error" in data && data.error) {
      setError(String(data.error));
      return;
    }
    evento.currentTarget.reset();
    setError(null);
    await cargar();
  }

  return (
    <section className="panel">
      <h1>Usuarios del portal</h1>
      <p className="panel__descripcion">
        El login es usuario + slug. Requiere la Edge Function <code>crear-usuario</code>.
      </p>
      {error && <p className="aviso">{error}</p>}
      <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
        <label>
          Usuario
          <input name="usuario" required />
        </label>
        <label>
          Nombre
          <input name="nombre" required />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" required />
        </label>
        <label>
          Rol
          <select name="rol">
            {ROLES_EMPRESA.map((r) => (
              <option key={r} value={r}>
                {etiquetaRol(r)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Área
          <SelectArea />
        </label>
        <div>
          <button className="btn btn--primario" type="submit">
            Crear usuario
          </button>
        </div>
      </form>
      <div className="tabla-wrap tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Área</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr>
                <td colSpan={5} className="mensaje-vacio">
                  Sin usuarios.
                </td>
              </tr>
            )}
            {lista.map((u) => (
              <tr key={u.id}>
                <td>{u.usuario}</td>
                <td>{u.nombre}</td>
                <td>{etiquetaRol(u.rol)}</td>
                <td>{u.area}</td>
                <td>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      void supabase
                        .from("usuarios_portal")
                        .update({ activo: !u.activo })
                        .eq("id", u.id)
                        .then(() => cargar())
                    }
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
