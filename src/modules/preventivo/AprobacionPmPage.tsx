import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import { actualizarPreventivo, estadoPm, listarPreventivo, type RegistroPreventivo } from "./preventivoService";

function AprobacionPmPage() {
  const { puede } = useAuth();
  const { organizacion } = useOrganizacion();
  const [registros, setRegistros] = useState<RegistroPreventivo[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!organizacion) return;
    try {
      const lista = await listarPreventivo(organizacion.id);
      setRegistros(lista.filter((item) => estadoPm(item) === "pendiente_aprobacion"));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacion?.id]);

  async function aprobar(item: RegistroPreventivo) {
    await actualizarPreventivo(item.id, {
      datos: { ...item.datos, estado: "aprobado", firma: true },
    });
    await cargar();
  }

  return (
    <section className="panel">
      <h1>Aprobar preventivo</h1>
      <p className="panel__descripcion">PM pendientes de firma del líder o administrador.</p>
      {error && <p className="aviso">{error}</p>}
      <div className="rejilla-cards">
        {registros.map((item) => (
          <article className="tarjeta" key={item.id}>
            <h2>{item.datos.equipo || item.area}</h2>
            <p>
              {item.fecha} · {item.descripcion}
            </p>
            {puede("aprobar.preventivo") && (
              <button type="button" className="btn btn--primario" onClick={() => void aprobar(item)}>
                Aprobar y firmar
              </button>
            )}
          </article>
        ))}
      </div>
      {registros.length === 0 && <p className="mensaje-vacio">No hay PM pendientes de aprobación.</p>}
    </section>
  );
}

export default AprobacionPmPage;
