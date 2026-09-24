import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { throwIf } from "../lib/util";
import { useApp } from "../state/AppContext";

export default function ConfiguracionPage() {
  const { org, areas, puede, recargar } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (!org || !puede("editar.configuracion")) {
    return <p className="aviso">Solo el administrador de la empresa configura marca y áreas.</p>;
  }

  const empresa = org;

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    const fd = new FormData(evento.currentTarget);
    try {
      let logo_url = empresa.logo_url;
      const archivo = fd.get("logo");
      if (archivo instanceof File && archivo.size) {
        const ext = (archivo.name.split(".").pop() || "png").toLowerCase();
        const ruta = `${empresa.id}/logo.${ext}`;
        const { error: upErr } = await supabase.storage.from("adjuntos").upload(ruta, archivo, {
          upsert: true,
          contentType: archivo.type || "image/png",
        });
        throwIf(upErr);
        logo_url = `${supabase.storage.from("adjuntos").getPublicUrl(ruta).data.publicUrl}?t=${Date.now()}`;
      }
      const { error: err } = await supabase
        .from("organizaciones")
        .update({
          nombre: String(fd.get("nombre") || "").trim(),
          color: String(fd.get("color") || "#2563eb"),
          logo_url,
          modulos: { mantenimiento: fd.get("mantenimiento") === "on", calidad: fd.get("calidad") === "on" },
        })
        .eq("id", empresa.id);
      throwIf(err);
      await recargar();
      setOk("Configuración guardada.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function nuevaArea(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const fd = new FormData(evento.currentTarget);
    const { error: err } = await supabase
      .from("areas")
      .insert({ organizacion_id: empresa.id, nombre: String(fd.get("nombre") || "").trim() });
    if (err) setError(err.message);
    else {
      evento.currentTarget.reset();
      await recargar();
    }
  }

  return (
    <section className="panel">
      <h1>Configuración de la empresa</h1>
      {error && <p className="aviso">{error}</p>}
      {ok && <p className="mensaje-vacio">{ok}</p>}
      <form className="tarjeta form-stack" onSubmit={(e) => void guardar(e)}>
        <h2>Marca</h2>
        <label>
          Nombre
          <input name="nombre" defaultValue={empresa.nombre} />
        </label>
        <label>
          Color
          <input type="color" name="color" defaultValue={empresa.color || "#2563eb"} />
        </label>
        <label>
          Logo
          <input type="file" name="logo" accept="image/*" />
        </label>
        <label>
          <input type="checkbox" name="mantenimiento" defaultChecked={empresa.modulos.mantenimiento} /> Módulo
          mantenimiento
        </label>
        <label>
          <input type="checkbox" name="calidad" defaultChecked={empresa.modulos.calidad} /> Módulo calidad
        </label>
        <button className="btn btn--primario" type="submit">
          Guardar
        </button>
      </form>
      <form className="tarjeta form-grid" onSubmit={(e) => void nuevaArea(e)}>
        <h2 style={{ gridColumn: "1 / -1" }}>Áreas</h2>
        <label>
          Nueva área
          <input name="nombre" required />
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
                      void supabase
                        .from("areas")
                        .update({ tiene_preventivo: !area.tiene_preventivo })
                        .eq("id", area.id)
                        .then(() => recargar())
                    }
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={area.activa}
                    onChange={() =>
                      void supabase.from("areas").update({ activa: !area.activa }).eq("id", area.id).then(() => recargar())
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn--peligro"
                    onClick={() => void supabase.from("areas").delete().eq("id", area.id).then(() => recargar())}
                  >
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
