import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { slugificar, throwIf } from "../lib/util";
import { useApp } from "../state/AppContext";

interface OrgRow {
  id: string;
  slug: string;
  nombre: string;
  activa: boolean;
  modulos: { mantenimiento?: boolean; calidad?: boolean };
}

export default function EmpresasPage() {
  const { puede } = useApp();
  const [lista, setLista] = useState<OrgRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    const { data, error: err } = await supabase.from("organizaciones").select("*").order("nombre");
    throwIf(err);
    setLista((data ?? []) as OrgRow[]);
  }

  useEffect(() => {
    void cargar().catch((e: Error) => setError(e.message));
  }, []);

  if (!puede("ver.empresas")) return <p className="aviso">Solo la cuenta plataforma da de alta empresas.</p>;

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    const fd = new FormData(evento.currentTarget);
    try {
      const nombre = String(fd.get("nombre") || "").trim();
      const slug = slugificar(String(fd.get("slug") || nombre));
      const { data: org, error: err } = await supabase
        .from("organizaciones")
        .insert({ nombre, slug, color: "#2563eb", modulos: { mantenimiento: true, calidad: true } })
        .select("*")
        .single();
      throwIf(err);
      const pass = String(fd.get("admin_password") || "");
      if (pass && org) {
        const { error: fnError, data: fnData } = await supabase.functions.invoke("crear-usuario", {
          body: {
            organizacion_id: org.id,
            slug: org.slug,
            usuario: String(fd.get("admin_usuario") || "admin"),
            nombre: String(fd.get("admin_nombre") || `Admin ${org.nombre}`),
            password: pass,
            rol: "admin",
          },
        });
        if (fnError) throw new Error("Empresa creada. El admin no se pudo crear: " + fnError.message);
        if (fnData && typeof fnData === "object" && "error" in fnData && fnData.error) {
          throw new Error(String(fnData.error));
        }
      }
      evento.currentTarget.reset();
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="panel">
      <h1>Empresas</h1>
      <p className="panel__descripcion">Alta de clientes. Cada organización queda aislada por RLS.</p>
      {error && <p className="aviso">{error}</p>}
      <form className="tarjeta form-grid" onSubmit={(e) => void crear(e)}>
        <label>
          Nombre comercial
          <input name="nombre" required />
        </label>
        <label>
          Slug
          <input name="slug" placeholder="acme" />
        </label>
        <label>
          Usuario admin
          <input name="admin_usuario" defaultValue="admin" />
        </label>
        <label>
          Nombre admin
          <input name="admin_nombre" />
        </label>
        <label>
          Contraseña admin
          <input name="admin_password" type="password" />
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
            <button
              type="button"
              className="btn"
              onClick={() =>
                void supabase
                  .from("organizaciones")
                  .update({ activa: !org.activa })
                  .eq("id", org.id)
                  .then(() => cargar())
              }
            >
              {org.activa ? "Desactivar" : "Activar"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
