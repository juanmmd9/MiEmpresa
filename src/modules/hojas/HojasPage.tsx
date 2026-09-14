import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useOrganizacion } from "../organizacion/OrganizacionContext";
import { crearHoja, eliminarHoja, listarHojas, type HojaVida } from "./hojasService";

function HojasPage() {
  const { puede } = useAuth();
  const { organizacion, areasActivas } = useOrganizacion();
  const [hojas, setHojas] = useState<HojaVida[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [area, setArea] = useState("");
  const [frecuencia, setFrecuencia] = useState("1");

  async function cargar() {
    if (!organizacion) return;
    try {
      setHojas(await listarHojas(organizacion.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacion?.id]);

  async function manejarAlta(evento: FormEvent) {
    evento.preventDefault();
    if (!organizacion) return;
    setError(null);
    try {
      await crearHoja({
        organizacion_id: organizacion.id,
        nombre: nombre.trim(),
        codigo: codigo.trim() || undefined,
        area: area || areasActivas[0]?.nombre || "General",
        frecuencia_pm_meses: Number(frecuencia) || null,
      });
      setNombre("");
      setCodigo("");
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="panel">
      <div className="panel__cabecera">
        <div>
          <h1>Hojas de vida</h1>
          <p className="panel__descripcion">Equipos y máquinas de {organizacion?.nombre ?? "la empresa"}.</p>
        </div>
      </div>
      {error && <p className="aviso">{error}</p>}
      {puede("editar.hojas") && (
        <form className="tarjeta form-grid" onSubmit={(e) => void manejarAlta(e)}>
          <label>
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label>
            Código
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </label>
          <label>
            Área
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Selecciona</option>
              {areasActivas.map((item) => (
                <option key={item.id} value={item.nombre}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Frecuencia PM (meses)
            <input type="number" min={1} value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} />
          </label>
          <div>
            <button className="btn btn--primario" type="submit">
              Agregar equipo
            </button>
          </div>
        </form>
      )}
      <div className="rejilla-cards">
        {hojas.map((hoja) => (
          <article className="tarjeta" key={hoja.id}>
            <h2>{hoja.nombre}</h2>
            <p className="panel__descripcion">
              {hoja.codigo || "Sin código"} · {hoja.area}
            </p>
            <p>PM cada {hoja.frecuencia_pm_meses ?? "—"} mes(es)</p>
            <div className="acciones-fila">
              <Link className="btn" to={`/app/hojas-de-vida/${hoja.id}`}>
                Abrir
              </Link>
              {puede("eliminar.registros") && (
                <button
                  type="button"
                  className="btn btn--peligro"
                  onClick={() => void eliminarHoja(hoja.id).then(cargar)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {hojas.length === 0 && <p className="mensaje-vacio">Aún no hay equipos.</p>}
    </section>
  );
}

export default HojasPage;
