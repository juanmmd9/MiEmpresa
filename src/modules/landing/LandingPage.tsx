import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing__nav">
        <div className="landing__marca">
          <img src="/logo.svg" alt="" width={36} height={36} />
          MiEmpresa
        </div>
        <div className="landing__nav-acciones">
          <Link className="btn" to="/login">
            Entrar
          </Link>
          <Link className="btn btn--primario" to="/login">
            Solicitar demo
          </Link>
        </div>
      </nav>

      <header className="landing__hero">
        <h1>El sistema de mantenimiento y calidad que se acopla a tu empresa.</h1>
        <p>
          Digitaliza preventivo, correctivo, hojas de vida, no conformidades y acciones de mejora.
          Cada cliente tiene su marca, sus áreas y solo ve sus datos.
        </p>
        <div className="landing__cta">
          <Link className="btn btn--primario" to="/login">
            Entrar al portal
          </Link>
          <a className="btn" href="#modulos">
            Ver módulos
          </a>
        </div>
      </header>

      <section className="landing__seccion" id="modulos">
        <h2>Módulos del producto</h2>
        <div className="landing__modulos">
          <article className="landing__modulo">
            <h3>Mantenimiento</h3>
            <p>
              Hojas de vida, preventivo con cronograma y aprobación, solicitudes de correctivo e
              indicadores. El mismo flujo del portal de planta, configurable por empresa.
            </p>
          </article>
          <article className="landing__modulo">
            <h3>Calidad ISO 9001</h3>
            <p>
              No conformidades, acciones de mejora y gestión del cambio. Plantillas por organización,
              no formatos atados a una sola planta.
            </p>
          </article>
          <article className="landing__modulo">
            <h3>Multi-empresa</h3>
            <p>
              Alta en minutos: slug, logo, color, áreas y módulos activos. El personal entra con
              usuario y contraseña; los datos no se mezclan entre clientes.
            </p>
          </article>
        </div>
      </section>

      <section className="landing__seccion">
        <h2>Cómo se acopla a una empresa</h2>
        <div className="landing__pasos">
          <article className="landing__paso">
            <h3>Crear la empresa</h3>
            <p>La plataforma da de alta el tenant, el admin inicial y los módulos contratados.</p>
          </article>
          <article className="landing__paso">
            <h3>Configurar</h3>
            <p>Logo, áreas de planta y catálogos. Sin cambiar código ni otro proyecto de nube.</p>
          </article>
          <article className="landing__paso">
            <h3>Operar</h3>
            <p>Mantenimiento y calidad en el mismo portal, con roles de planta y gerencia.</p>
          </article>
        </div>
      </section>

      <footer className="landing__pie">MiEmpresa · mantenimiento + sistema de gestión de calidad</footer>
    </div>
  );
}

export default LandingPage;
