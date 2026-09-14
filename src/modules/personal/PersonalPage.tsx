import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import { actualizarPersona, crearPersona, listarPersonal, type Persona } from "./personalService";

function PersonalPage() {
  const { puede } = useAuth();
  const { organizacion, areasActivas } = useOrganizacion();
  const [lista, setLista] = useState<Persona[]>([]);
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [area, setArea] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!organizacion) return;
    try {
      setLista(await listarPersonal(organizacion.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacion?.id]);

  async function crear(evento: FormEvent) {
    evento.preventDefault();
    if (!organizacion) return;
    try {
      await crearPersona({
        organizacion_id: organizacion.id,
        nombre: nombre.trim(),
        cargo: cargo.trim() || null,
        area: area || null,
        cedula: null,
      });
      setNombre("");
      setCargo("");
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="panel">
      <div className="panel__cabecera">
        <div>
          <h1>Personal</h1>
          <p className="panel__descripcion">Directorio de la empresa. Enlázalo luego a usuarios del portal.</p>
        </div>
        <Link className="btn" to="/app/personal/usuarios">
          Usuarios del portal
        </Link>
      </div>
      {error && <p className="aviso">{error}</p>}
      {puede("editar.personal") && (
        <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
          <label>
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label>
            Cargo
            <input value={cargo} onChange={(e) => setCargo(e.target.value)} />
          </label>
          <label>
            Área
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">—</option>
              {areasActivas.map((item) => (
                <option key={item.id} value={item.nombre}>
                  {item.nombre}
                </option>
              ))}
            </select>
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
            {lista.map((persona) => (
              <tr key={persona.id}>
                <td>{persona.nombre}</td>
                <td>{persona.cargo}</td>
                <td>{persona.area}</td>
                <td>
                  {puede("editar.personal") ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => void actualizarPersona(persona.id, { activo: !persona.activo }).then(cargar)}
                    >
                      {persona.activo ? "Activo" : "Inactivo"}
                    </button>
                  ) : persona.activo ? (
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

export default PersonalPage;
