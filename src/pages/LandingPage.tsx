import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";

const logo = `${import.meta.env.BASE_URL}logo.svg`;

function Stat({
  meta,
  sufijo = "",
  etiqueta,
}: {
  meta: number;
  sufijo?: string;
  etiqueta: string;
}) {
  const [valor, setValor] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        io.disconnect();
        const inicio = performance.now();
        const duracion = 900;
        const tick = (ahora: number) => {
          const p = Math.min(1, (ahora - inicio) / duracion);
          setValor(Math.round(meta * p));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(nodo);
    return () => io.disconnect();
  }, [meta]);

  return (
    <div className="site-stat">
      <span ref={ref} className="site-stat__n">
        {valor}
        {sufijo}
      </span>
      <span className="site-stat__l">{etiqueta}</span>
    </div>
  );
}

function Icono({ children }: { children: ReactNode }) {
  return (
    <div className="site-card__icon" aria-hidden="true">
      {children}
    </div>
  );
}

const CITAS = [
  {
    texto:
      "Pasamos las hojas de vida y el preventivo de Excel al portal. Cada área ve solo lo suyo y gerencia consulta los indicadores sin pedirnos reportes.",
    autor: "Coordinación de mantenimiento",
    cargo: "Planta industrial",
  },
  {
    texto:
      "Las solicitudes de correctivo llegan con área y descripción. Mantenimiento las toma y las cierra; ya no se pierden en un grupo de chat.",
    autor: "Líder de área",
    cargo: "Operaciones",
  },
  {
    texto:
      "No conformidades y acciones de mejora quedan en el mismo sistema que el mantenimiento. La auditoría deja de ser una carpeta aparte.",
    autor: "Gestión de calidad",
    cargo: "SGC ISO 9001",
  },
];

export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [cita, setCita] = useState(0);
  const [enviado, setEnviado] = useState(false);

  function pedirDemo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviado(true);
  }

  return (
    <div className="site">
      <header className="site-head">
        <div className="site-topbar">
          <div className="site-topbar__inner">
            <p className="site-topbar__contacto">
              Contáctenos: <a href="#demo">solicita una demo</a>
            </p>
            <div className="site-topbar__redes">
              <span>Software + acompañamiento</span>
            </div>
          </div>
        </div>
        <div className="site-bar">
          <div className="site-bar__inner">
            <a className="site-logo" href="#inicio" onClick={() => setMenu(false)}>
              <img src={logo} alt="" width={48} height={48} />
              MiEmpresa
            </a>
            <nav className="site-nav" aria-label="Principal">
              <a href="#inicio">Inicio</a>
              <a href="#producto">Producto</a>
              <a href="#modulos">Módulos</a>
              <Link to="/login">Entrar</Link>
            </nav>
            <a className="site-cta" href="#demo">
              Solicitar demo →
            </a>
            <button
              type="button"
              className="site-hamburger"
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
        {menu && (
          <nav className="site-movil" aria-label="Móvil">
            <a href="#inicio" onClick={() => setMenu(false)}>
              Inicio
            </a>
            <a href="#producto" onClick={() => setMenu(false)}>
              Producto
            </a>
            <a href="#modulos" onClick={() => setMenu(false)}>
              Módulos
            </a>
            <Link to="/login" onClick={() => setMenu(false)}>
              Entrar
            </Link>
            <a className="site-cta site-cta--bloque" href="#demo" onClick={() => setMenu(false)}>
              Solicitar demo →
            </a>
          </nav>
        )}
      </header>

      <main>
        <section className="site-hero" id="inicio">
          <div className="site-hero__inner">
            <div className="site-hero__texto">
              <h1>
                Gestiona mantenimiento y calidad desde una sola plataforma.{" "}
                <span className="site-marca">Preventivo, correctivo e ISO 9001</span>
              </h1>
              <p>
                Indicadores automáticos, evidencias por empresa y auditorías siempre bajo control. Cada
                cliente tiene su marca, sus áreas y solo ve sus datos.
              </p>
              <div className="site-hero__botones">
                <Link className="site-btn site-btn--oscuro" to="/login">
                  Entrar al portal <span>›</span>
                </Link>
                <a className="site-btn site-btn--linea" href="#demo">
                  Cotiza ahora <span>›</span>
                </a>
              </div>
            </div>
            <div className="site-hero__figura" aria-hidden="true">
              <div className="site-preview">
                <div className="site-preview__top">
                  <span />
                  <span />
                  <span />
                  <strong>Portal MiEmpresa</strong>
                </div>
                <div className="site-preview__kpis">
                  <div>
                    <small>PM del mes</small>
                    <b>18</b>
                  </div>
                  <div>
                    <small>Solicitudes</small>
                    <b>5</b>
                  </div>
                  <div>
                    <small>NC abiertas</small>
                    <b>2</b>
                  </div>
                </div>
                <ul>
                  <li>
                    <em>Prensa hidráulica</em>
                    <span>PM pendiente</span>
                  </li>
                  <li>
                    <em>Caldera 02</em>
                    <span>Solicitud abierta</span>
                  </li>
                  <li>
                    <em>NC-014</em>
                    <span>En seguimiento</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="site-about" id="producto">
          <div className="site-about__oscuro">
            <h2>MiEmpresa</h2>
          </div>
          <div className="site-about__claro">
            <h3>
              Un portal <strong>multi-empresa</strong> para digitalizar mantenimiento y el sistema de
              gestión de calidad. <strong>Software en la nube, listo para acoplarse a tu operación.</strong>
            </h3>
            <p>
              Cada organización entra con su slug, logo y áreas. El administrador activa mantenimiento o
              calidad y los roles ven solo lo que les corresponde.
            </p>
            <div className="site-stats">
              <Stat meta={2} etiqueta="Módulos del producto" />
              <Stat meta={100} sufijo="%" etiqueta="Plataforma en la nube" />
              <Stat meta={1} etiqueta="Dato por empresa, aislado" />
              <Stat meta={7} etiqueta="Roles de acceso" />
            </div>
            <a className="site-about__link" href="#modulos">
              Ver módulos del producto <span>›</span>
            </a>
            <ul className="site-about__lista">
              <li>Mantenimiento preventivo, correctivo y hojas de vida</li>
              <li>Calidad: no conformidades, mejora y gestión del cambio</li>
              <li>Alta de empresas, áreas y usuarios con aislamiento de datos</li>
            </ul>
          </div>
        </section>

        <section className="site-features" id="modulos">
          <div className="site-features__grid">
            <div className="site-features__intro">
              <h2>Por qué las empresas eligen MiEmpresa</h2>
              <p>
                Una plataforma para operar el mantenimiento de planta y el SGC sin mezclar clientes ni
                depender de hojas de cálculo dispersas.
              </p>
            </div>
            <article className="site-card">
              <Icono>
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <path
                    fill="currentColor"
                    d="M19 3H5a2 2 0 0 0-2 2v14l4-2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-2 10H7v-2h10v2Zm0-4H7V7h10v2Z"
                  />
                </svg>
              </Icono>
              <h3>Hojas de vida del equipo</h3>
              <p>Inventario de máquinas por área, frecuencia de PM e historial de intervenciones.</p>
            </article>
            <article className="site-card">
              <Icono>
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <path
                    fill="currentColor"
                    d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14v10Z"
                  />
                </svg>
              </Icono>
              <h3>Preventivo con aprobación</h3>
              <p>Cronograma, registro de ejecución y firma del líder o administrador.</p>
            </article>
            <article className="site-card">
              <Icono>
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <path
                    fill="currentColor"
                    d="M20 2H4v20l4-4h12V2Zm-2 12H6v-2h12v2Zm0-4H6V8h12v2Z"
                  />
                </svg>
              </Icono>
              <h3>Solicitudes de correctivo</h3>
              <p>El área reporta la falla; mantenimiento la toma, la ejecuta y la cierra.</p>
            </article>
            <article className="site-card">
              <Icono>
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <path fill="currentColor" d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
                </svg>
              </Icono>
              <h3>Indicadores en tiempo real</h3>
              <p>PM del mes, horas programadas, solicitudes abiertas y no conformidades.</p>
            </article>
            <article className="site-card">
              <Icono>
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <path
                    fill="currentColor"
                    d="M12 2 2 7l10 5 10-5-10-5Zm0 9L2 6v11l10 5 10-5V6l-10 5Z"
                  />
                </svg>
              </Icono>
              <h3>Calidad ISO 9001</h3>
              <p>No conformidades, acciones de mejora y gestión del cambio, activables por empresa.</p>
            </article>
            <article className="site-card site-card--destacada">
              <h3>Centraliza mantenimiento y calidad en un único sistema para tu empresa.</h3>
              <a href="#demo">
                + Solicitar demo
              </a>
            </article>
          </div>
        </section>

        <section className="site-citas" id="clientes">
          <div className="site-citas__caja">
            <span className="site-citas__marca">“</span>
            <p>{CITAS[cita].texto}</p>
            <footer>
              <strong>{CITAS[cita].autor}</strong>
              <span>{CITAS[cita].cargo}</span>
            </footer>
            <div className="site-citas__puntos">
              {CITAS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={i === cita ? "is-on" : ""}
                  aria-label={`Cita ${i + 1}`}
                  onClick={() => setCita(i)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="site-demo" id="demo">
          <div className="site-demo__inner">
            <div>
              <h2>Solicita una demostración</h2>
              <p>
                Cuéntanos tu empresa y te mostramos el portal con tus áreas, preventivo y calidad. También
                puedes entrar si ya tienes usuario.
              </p>
              <Link className="site-btn site-btn--oscuro" to="/login">
                Ya tengo acceso <span>›</span>
              </Link>
            </div>
            {enviado ? (
              <p className="site-demo__ok">Gracias. Revisaremos tu solicitud y te contactaremos.</p>
            ) : (
              <form className="site-form" onSubmit={pedirDemo}>
                <label>
                  Nombre
                  <input name="nombre" required autoComplete="name" />
                </label>
                <label>
                  Empresa
                  <input name="empresa" required autoComplete="organization" />
                </label>
                <label>
                  Correo
                  <input name="correo" type="email" required autoComplete="email" />
                </label>
                <label>
                  Mensaje
                  <textarea name="mensaje" rows={3} placeholder="Número de sedes, equipos o norma ISO…" />
                </label>
                <button className="site-btn site-btn--oscuro" type="submit">
                  Enviar solicitud <span>›</span>
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer className="site-pie">
        <div className="site-pie__grid">
          <div>
            <h3>Producto</h3>
            <p>Mantenimiento de planta y sistema de gestión de calidad, multi-empresa.</p>
          </div>
          <div>
            <h3>Contacto</h3>
            <p>
              <a href="#demo">Formulario de demo</a>
            </p>
            <p>
              <Link to="/login">Entrar al portal</Link>
            </p>
          </div>
          <div>
            <h3>Horario de atención</h3>
            <p>Lunes a viernes: 8:00 – 16:00</p>
          </div>
        </div>
        <p className="site-pie__copy">© {new Date().getFullYear()} MiEmpresa. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
