import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { crearUsuarioEmpresa } from "../auth/authService";
import { slugificar } from "../../lib/slug";
import {
  actualizarOrganizacion,
  crearOrganizacion,
  listarOrganizaciones,
  type Organizacion,
} from "../organizacion/organizacionService";

function EmpresasPage() {
  const { esPlataforma } = useAuth();
  const [lista, setLista] = useState<Organizacion[]>([]);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [adminUsuario, setAdminUsuario] = useState("admin");
  const [adminNombre, setAdminNombre] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    try {
      setLista(await listarOrganizaciones());
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  if (!esPlataforma) {
    return <p className="aviso">Solo la cuenta plataforma da de alta empresas.</p>;
  }

  async function crear(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    try {
      const org = await crearOrganizacion({ nombre, slug: slug || slugificar(nombre) });
      if (adminPassword) {
        await crearUsuarioEmpresa({
          organizacionId: org.id,
          slug: org.slug,
          usuario: adminUsuario,
          nombre: adminNombre || `Admin ${org.nombre}`,
          password: adminPassword,
          rol: "admin",
        });
      }
      setNombre("");
      setSlug("");
      setAdminPassword("");
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="panel">
      <h1>Empresas</h1>
      <p className="panel__descripcion">
        Alta de clientes. Cada organización queda aislada por RLS. El admin entra con usuario + slug.
      </p>
      {error && <p className="aviso">{error}</p>}
      <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
        <label>
          Nombre comercial
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label>
          Slug
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={slugificar(nombre) || "acme"}
          />
        </label>
        <label>
          Usuario admin
          <input value={adminUsuario} onChange={(e) => setAdminUsuario(e.target.value)} />
        </label>
        <label>
          Nombre admin
          <input value={adminNombre} onChange={(e) => setAdminNombre(e.target.value)} />
        </label>
        <label>
          Contraseña admin
          <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
        </label>
        <div>
          <button className="btn btn--primario" type="submit">
            Crear empresa
          </button>
        </div>
      </form>
      <div className="rejilla-cards">
        {lista.map((org) => (
          <article className="tarjeta" key={org.id}>
            <h2>{org.nombre}</h2>
            <p className="panel__descripcion">slug: {org.slug}</p>
            <p>
              Mantenimiento {org.modulos.mantenimiento ? "sí" : "no"} · Calidad {org.modulos.calidad ? "sí" : "no"}
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => void actualizarOrganizacion(org.id, { activa: !org.activa }).then(cargar)}
            >
              {org.activa ? "Desactivar" : "Activar"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default EmpresasPage;
