import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import {
  actualizarArea,
  actualizarOrganizacion,
  crearArea,
  eliminarArea,
  subirLogoOrg,
} from "../organizacion/organizacionService";
import type { ModulosOrg } from "../../lib/modulos";

function ConfiguracionPage() {
  const { puede } = useAuth();
  const { organizacion, areas, recargar, colorMarca } = useOrganizacion();
  const [nombre, setNombre] = useState(organizacion?.nombre ?? "");
  const [color, setColor] = useState(organizacion?.color ?? "#2563eb");
  const [modulos, setModulos] = useState<ModulosOrg>(
    organizacion?.modulos ?? { mantenimiento: true, calidad: true },
  );
  const [nuevaArea, setNuevaArea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!organizacion) return;
    setNombre(organizacion.nombre);
    setColor(organizacion.color);
    setModulos(organizacion.modulos);
  }, [organizacion]);

  if (!organizacion) {
    return <p className="aviso">Esta cuenta no está ligada a una empresa.</p>;
  }

  const org = organizacion;

  async function guardarMarca(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    try {
      await actualizarOrganizacion(org.id, { nombre: nombre.trim(), color, modulos });
      await recargar();
      setOk("Configuración guardada.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function manejarLogo(archivo: File | null) {
    if (!archivo) return;
    try {
      const url = await subirLogoOrg(org.id, archivo);
      await actualizarOrganizacion(org.id, { logo_url: url });
      await recargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function agregarArea(evento: FormEvent) {
    evento.preventDefault();
    try {
      await crearArea(org.id, nuevaArea);
      setNuevaArea("");
      await recargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!puede("editar.configuracion")) {
    return <p className="aviso">Solo el administrador de la empresa configura marca y áreas.</p>;
  }

  return (
    <section className="panel">
      <h1>Configuración de la empresa</h1>
      <p className="panel__descripcion">
        Marca, módulos contratados y catálogo de áreas. Así el producto se acopla sin tocar código.
      </p>
      {error && <p className="aviso">{error}</p>}
      {ok && <p className="mensaje-vacio">{ok}</p>}

      <form className="tarjeta form-stack" onSubmit={(e) => void guardarMarca(e)}>
        <h2>Marca</h2>
        <label>
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label>
          Color
          <input type="color" value={color || colorMarca} onChange={(e) => setColor(e.target.value)} />
        </label>
        <label>
          Logo
          <input type="file" accept="image/*" onChange={(e) => void manejarLogo(e.target.files?.[0] ?? null)} />
        </label>
        <label>
          <input
            type="checkbox"
            checked={modulos.mantenimiento}
            onChange={(e) => setModulos((m) => ({ ...m, mantenimiento: e.target.checked }))}
          />{" "}
          Módulo mantenimiento
        </label>
        <label>
          <input
            type="checkbox"
            checked={modulos.calidad}
            onChange={(e) => setModulos((m) => ({ ...m, calidad: e.target.checked }))}
          />{" "}
          Módulo calidad
        </label>
        <button className="btn btn--primario" type="submit">
          Guardar
        </button>
      </form>

      <form className="tarjeta form-grid" onSubmit={(e) => void agregarArea(e)}>
        <h2 style={{ gridColumn: "1 / -1" }}>Áreas</h2>
        <label>
          Nueva área
          <input value={nuevaArea} onChange={(e) => setNuevaArea(e.target.value)} required />
        </label>
        <div>
          <button className="btn btn--primario" type="submit">
            Agregar área
          </button>
        </div>
      </form>

      <div className="tabla-wrap tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th>Área</th>
              <th>Preventivo</th>
              <th>Activa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.id}>
                <td>{area.nombre}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={area.tiene_preventivo}
                    onChange={() =>
                      void actualizarArea(area.id, { tiene_preventivo: !area.tiene_preventivo }).then(recargar)
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={area.activa}
                    onChange={() => void actualizarArea(area.id, { activa: !area.activa }).then(recargar)}
                  />
                </td>
                <td>
                  <button type="button" className="btn btn--peligro" onClick={() => void eliminarArea(area.id).then(recargar)}>
                    Quitar
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

export default ConfiguracionPage;
