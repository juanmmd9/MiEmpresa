import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { ETIQUETAS_ROL, ROLES_EMPRESA, etiquetaRol, type RolPortal } from "../auth/roles";
import { actualizarUsuarioPortal, crearUsuarioEmpresa, listarUsuariosOrg } from "../auth/authService";
import { type UsuarioPortal } from "../auth/roles";
import { useOrganizacion } from "../organizacion/OrganizacionContext";

function UsuariosPage() {
  const { puede } = useAuth();
  const { organizacion, areasActivas } = useOrganizacion();
  const [lista, setLista] = useState<UsuarioPortal[]>([]);
  const [usuario, setUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolPortal>("operador");
  const [area, setArea] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!organizacion) return;
    try {
      setLista(await listarUsuariosOrg(organizacion.id));
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
    setError(null);
    try {
      await crearUsuarioEmpresa({
        organizacionId: organizacion.id,
        slug: organizacion.slug,
        usuario,
        nombre,
        password,
        rol,
        area: area || null,
      });
      setUsuario("");
      setNombre("");
      setPassword("");
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!puede("gestionar.usuarios")) {
    return <p className="aviso">No tienes permiso para gestionar usuarios.</p>;
  }

  return (
    <section className="panel">
      <h1>Usuarios del portal</h1>
      <p className="panel__descripcion">
        El login es usuario + slug de empresa. Requiere la Edge Function <code>crear-usuario</code>.
      </p>
      {error && <p className="aviso">{error}</p>}
      <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
        <label>
          Usuario
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
        </label>
        <label>
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <label>
          Rol
          <select value={rol} onChange={(e) => setRol(e.target.value as RolPortal)}>
            {ROLES_EMPRESA.map((item) => (
              <option key={item} value={item}>
                {ETIQUETAS_ROL[item]}
              </option>
            ))}
          </select>
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
            {lista.map((item) => (
              <tr key={item.id}>
                <td>{item.usuario}</td>
                <td>{item.nombre}</td>
                <td>{etiquetaRol(item.rol)}</td>
                <td>{item.area}</td>
                <td>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void actualizarUsuarioPortal(item.id, { activo: !item.activo }).then(cargar)}
                  >
                    {item.activo ? "Desactivar" : "Activar"}
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

export default UsuariosPage;
