import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config.js";
import {
  ROLES_EMPRESA,
  enlacesDe,
  etiquetaRol,
  moduloActivo,
  puede,
  permisoRuta,
  rutaInicio,
} from "./roles.js";

const root = document.getElementById("root");
const configurado =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_ANON_KEY) &&
  !SUPABASE_URL.includes("TU-PROYECTO") &&
  SUPABASE_ANON_KEY !== "tu-anon-key";

const supabase = createClient(
  configurado ? SUPABASE_URL : "https://placeholder.supabase.co",
  configurado ? SUPABASE_ANON_KEY : "public-anon-placeholder",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);

const state = {
  session: null,
  perfil: null,
  org: null,
  areas: [],
  cargando: true,
  error: null,
};

function esc(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugificar(valor) {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function rutaActual() {
  const raw = (location.hash || "#/").replace(/^#/, "") || "/";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return path.replace(/\/$/, "") || "/";
}

function throwIf(error) {
  if (error) throw new Error(error.message);
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function periodoMes() {
  return new Date().toISOString().slice(0, 7);
}

function opcionesAreas(seleccionada = "") {
  return state.areas
    .filter((a) => a.activa)
    .map(
      (a) =>
        `<option value="${esc(a.nombre)}" ${a.nombre === seleccionada ? "selected" : ""}>${esc(a.nombre)}</option>`,
    )
    .join("");
}

function aviso(texto) {
  return texto ? `<p class="aviso">${esc(texto)}</p>` : "";
}

async function cargarSesion() {
  if (!configurado) {
    state.cargando = false;
    return;
  }
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  if (data.session?.user.id) {
    const { data: perfil, error } = await supabase
      .from("usuarios_portal")
      .select("id, organizacion_id, usuario, email, nombre, rol, personal_id, area, activo")
      .eq("id", data.session.user.id)
      .maybeSingle();
    if (error) state.error = error.message;
    state.perfil = perfil && perfil.activo ? perfil : null;
    if (state.perfil?.organizacion_id) {
      const [{ data: org }, { data: areas }] = await Promise.all([
        supabase.from("organizaciones").select("*").eq("id", state.perfil.organizacion_id).maybeSingle(),
        supabase.from("areas").select("*").eq("organizacion_id", state.perfil.organizacion_id).order("orden").order("nombre"),
      ]);
      state.org = org
        ? { ...org, modulos: { mantenimiento: org.modulos?.mantenimiento !== false, calidad: org.modulos?.calidad !== false } }
        : null;
      state.areas = areas || [];
      if (state.org?.color) document.documentElement.style.setProperty("--color-primario", state.org.color);
    } else {
      state.org = null;
      state.areas = [];
    }
  } else {
    state.perfil = null;
    state.org = null;
    state.areas = [];
  }
  state.cargando = false;
}

function layout(contenido) {
  const perfil = state.perfil;
  const org = state.org;
  const path = rutaActual();
  const enlaces = enlacesDe(perfil?.rol, org?.modulos);
  const nav = enlaces
    .map((e) => {
      const href = e.ruta;
      const activo = path === href.replace("#", "") || (href === "#/app" && path === "/app");
      return `<a class="sidebar__enlace${activo ? " sidebar__enlace--activo" : ""}" href="${href}">${esc(e.texto)}</a>`;
    })
    .join("");
  const tabs = enlaces.slice(0, 3);
  const mas = enlaces.slice(3);
  return `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar__marca">
          <img class="sidebar__logo" src="${esc(org?.logo_url || "./logo.svg")}" alt="${esc(org?.nombre || "MiEmpresa")}" />
          <span class="sidebar__titulo">${esc(org?.nombre || "MiEmpresa")}</span>
        </div>
        <nav class="sidebar__nav">${nav}</nav>
        <div class="sidebar__usuario">
          <span class="sidebar__usuario-nombre">${esc(perfil?.nombre || perfil?.usuario)}</span>
          <span class="sidebar__usuario-rol">${esc(etiquetaRol(perfil?.rol))}${perfil?.area ? " · " + esc(perfil.area) : ""}</span>
          <button type="button" class="btn sidebar__cerrar-sesion" data-act="salir">Cerrar sesión</button>
        </div>
      </aside>
      <div class="layout__cuerpo">
        <header class="layout__topbar">
          <span class="layout__topbar-titulo">${esc(org?.nombre || "MiEmpresa")}</span>
        </header>
        <main class="layout__contenido">${contenido}</main>
        <nav class="bottom-nav">
          ${tabs.map((e) => `<a class="bottom-nav__item" href="${e.ruta}">${esc(e.texto)}</a>`).join("")}
          ${mas.length ? `<button type="button" class="bottom-nav__item" data-act="mas">Más</button>` : ""}
        </nav>
      </div>
    </div>
    <div class="mas-sheet" id="mas-sheet" hidden>
      <button type="button" class="mas-sheet__fondo" data-act="cerrar-mas" aria-label="Cerrar"></button>
      <div class="mas-sheet__panel">
        <h2>Más módulos</h2>
        <div class="mas-sheet__grid">
          ${mas.map((e) => `<a class="mas-sheet__tile" href="${e.ruta}">${esc(e.texto)}</a>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function landingHtml() {
  return `
    <div class="landing">
      <nav class="landing__nav">
        <div class="landing__marca"><img src="./logo.svg" alt="" width="36" height="36" /> MiEmpresa</div>
        <div class="landing__nav-acciones">
          <a class="btn" href="#/login">Entrar</a>
          <a class="btn btn--primario" href="#/login">Solicitar demo</a>
        </div>
      </nav>
      <header class="landing__hero">
        <h1>El sistema de mantenimiento y calidad que se acopla a tu empresa.</h1>
        <p>Digitaliza preventivo, correctivo, hojas de vida, no conformidades y acciones de mejora. Cada cliente tiene su marca, sus áreas y solo ve sus datos.</p>
        <div class="landing__cta">
          <a class="btn btn--primario" href="#/login">Entrar al portal</a>
          <a class="btn" href="#modulos">Ver módulos</a>
        </div>
      </header>
      <section class="landing__seccion" id="modulos">
        <h2>Módulos del producto</h2>
        <div class="landing__modulos">
          <article class="landing__modulo"><h3>Mantenimiento</h3><p>Hojas de vida, preventivo con cronograma y aprobación, solicitudes de correctivo e indicadores.</p></article>
          <article class="landing__modulo"><h3>Calidad ISO 9001</h3><p>No conformidades, acciones de mejora y gestión del cambio. Plantillas por organización.</p></article>
          <article class="landing__modulo"><h3>Multi-empresa</h3><p>Alta en minutos: slug, logo, color, áreas y módulos. Los datos no se mezclan entre clientes.</p></article>
        </div>
      </section>
      <section class="landing__seccion">
        <h2>Cómo se acopla a una empresa</h2>
        <div class="landing__pasos">
          <article class="landing__paso"><h3>Crear la empresa</h3><p>La plataforma da de alta el tenant, el admin inicial y los módulos contratados.</p></article>
          <article class="landing__paso"><h3>Configurar</h3><p>Logo, áreas de planta y catálogos. Sin Vite, sin otro proyecto de código.</p></article>
          <article class="landing__paso"><h3>Operar</h3><p>Mantenimiento y calidad en el mismo portal, con roles de planta y gerencia.</p></article>
        </div>
      </section>
      <footer class="landing__pie">MiEmpresa · hospedado en GitHub Pages · datos en Supabase</footer>
    </div>
  `;
}

function loginHtml() {
  return `
    <div class="auth-login">
      <div class="auth-login__tarjeta">
        <header class="auth-login__marca">
          <img class="auth-login__logo" src="./logo.svg" alt="MiEmpresa" width="72" height="72" />
          <p class="auth-login__marca-texto">Portal multi-empresa</p>
        </header>
        <div class="auth-login__cuerpo">
          <h1>Entrar</h1>
          <p class="auth-login__subtitulo">Mantenimiento y sistema de gestión de calidad</p>
          ${!configurado ? `<p class="auth-login__aviso">Edita <code>js/config.js</code> con la URL y anon key de Supabase.</p>` : ""}
          <form class="auth-login__form" data-form="login">
            <label>Empresa (slug)<input name="slug" placeholder="acme — vacío si eres plataforma" autocomplete="organization" /></label>
            <label>Usuario o correo<input name="usuario" required placeholder="admin o correo" autocomplete="username" /></label>
            <label>Contraseña<input name="password" type="password" required autocomplete="current-password" /></label>
            ${aviso(state.error)}
            <button class="btn btn--primario auth-login__btn" type="submit">Entrar</button>
          </form>
          <a class="auth-login__enlace" href="#/">Volver al sitio</a>
          <p class="auth-login__pie">MiEmpresa</p>
        </div>
      </div>
    </div>
  `;
}

function cards(items, vacio) {
  if (!items.length) return `<p class="mensaje-vacio">${esc(vacio)}</p>`;
  return `<div class="rejilla-cards">${items.join("")}</div>`;
}

function tabla(headers, filas, vacio) {
  return `<div class="tabla-wrap tarjeta"><table class="tabla"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${filas}</tbody></table>${filas ? "" : `<p class="mensaje-vacio">${esc(vacio)}</p>`}</div>`;
}

async function paginaInicio() {
  const areas = state.areas.filter((a) => a.activa);
  if (!areas.length) {
    return `<section class="panel"><h1>Inicio</h1><p class="aviso">Esta empresa aún no tiene áreas. Un administrador las crea en <a href="#/app/configuracion">Configuración</a>.</p></section>`;
  }
  let pm = [];
  let corr = [];
  if (state.org) {
    const resultados = await Promise.all([
      supabase.from("preventivo").select("*").eq("organizacion_id", state.org.id),
      supabase.from("correctivo").select("*").eq("organizacion_id", state.org.id),
    ]);
    pm = resultados[0].data || [];
    corr = resultados[1].data || [];
  }
  const stats = {};
  for (const area of areas) stats[area.nombre] = { pm: 0, solicitudes: 0 };
  for (const item of pm || []) {
    if (!stats[item.area]) stats[item.area] = { pm: 0, solicitudes: 0 };
    if ((item.datos?.estado || "pendiente") !== "aprobado") stats[item.area].pm += 1;
  }
  for (const item of corr || []) {
    if ((item.datos?.tipo || "solicitud") !== "solicitud") continue;
    if (item.datos?.estado === "cerrada") continue;
    if (!stats[item.area]) stats[item.area] = { pm: 0, solicitudes: 0 };
    stats[item.area].solicitudes += 1;
  }
  return `
    <section class="panel">
      <h1>Inicio</h1>
      <p class="panel__descripcion">Tablero de ${esc(state.org?.nombre)}. Las áreas se configuran por cliente.</p>
      ${cards(
        areas.map(
          (area) => `<article class="tarjeta"><h2>${esc(area.nombre)}</h2>
            <p>PM pendientes: ${stats[area.nombre]?.pm ?? 0}</p>
            <p>Solicitudes abiertas: ${stats[area.nombre]?.solicitudes ?? 0}</p>
            <p>${area.tiene_preventivo ? "Incluye preventivo" : "Solo correctivo"}</p>
            <a class="btn" href="#/app/solicitudes">Ver solicitudes</a></article>`,
        ),
        "",
      )}
    </section>
  `;
}

async function paginaEmpresas() {
  if (!puede(state.perfil?.rol, "ver.empresas")) return `<p class="aviso">Solo la cuenta plataforma da de alta empresas.</p>`;
  const { data, error } = await supabase.from("organizaciones").select("*").order("nombre");
  throwIf(error);
  const lista = data || [];
  return `
    <section class="panel">
      <h1>Empresas</h1>
      <p class="panel__descripcion">Alta de clientes. Cada organización queda aislada por RLS.</p>
      ${aviso(state.error)}
      <form class="tarjeta form-grid" data-form="crear-empresa">
        <label>Nombre comercial<input name="nombre" required /></label>
        <label>Slug<input name="slug" placeholder="acme" /></label>
        <label>Usuario admin<input name="admin_usuario" value="admin" /></label>
        <label>Nombre admin<input name="admin_nombre" /></label>
        <label>Contraseña admin<input name="admin_password" type="password" /></label>
        <div><button class="btn btn--primario" type="submit">Crear empresa</button></div>
      </form>
      ${cards(
        lista.map(
          (org) => `<article class="tarjeta"><h2>${esc(org.nombre)}</h2>
            <p class="panel__descripcion">slug: ${esc(org.slug)}</p>
            <p>Mantenimiento ${org.modulos?.mantenimiento !== false ? "sí" : "no"} · Calidad ${org.modulos?.calidad !== false ? "sí" : "no"}</p>
            <button type="button" class="btn" data-act="toggle-org" data-id="${org.id}" data-activa="${org.activa ? "0" : "1"}">${org.activa ? "Desactivar" : "Activar"}</button></article>`,
        ),
        "Aún no hay empresas.",
      )}
    </section>
  `;
}

async function paginaConfiguracion() {
  const org = state.org;
  if (!org || !puede(state.perfil?.rol, "editar.configuracion")) {
    return `<p class="aviso">Solo el administrador de la empresa configura marca y áreas.</p>`;
  }
  const filas = state.areas
    .map(
      (a) => `<tr>
        <td>${esc(a.nombre)}</td>
        <td><input type="checkbox" data-act="area-pm" data-id="${a.id}" ${a.tiene_preventivo ? "checked" : ""} /></td>
        <td><input type="checkbox" data-act="area-activa" data-id="${a.id}" ${a.activa ? "checked" : ""} /></td>
        <td><button type="button" class="btn btn--peligro" data-act="area-borrar" data-id="${a.id}">Quitar</button></td>
      </tr>`,
    )
    .join("");
  return `
    <section class="panel">
      <h1>Configuración de la empresa</h1>
      <p class="panel__descripcion">Marca, módulos y catálogo de áreas. Así el producto se acopla sin tocar código.</p>
      ${aviso(state.error)}
      <form class="tarjeta form-stack" data-form="guardar-marca">
        <h2>Marca</h2>
        <label>Nombre<input name="nombre" value="${esc(org.nombre)}" /></label>
        <label>Color<input type="color" name="color" value="${esc(org.color || "#2563eb")}" /></label>
        <label>Logo<input type="file" name="logo" accept="image/*" /></label>
        <label><input type="checkbox" name="mantenimiento" ${org.modulos.mantenimiento ? "checked" : ""} /> Módulo mantenimiento</label>
        <label><input type="checkbox" name="calidad" ${org.modulos.calidad ? "checked" : ""} /> Módulo calidad</label>
        <button class="btn btn--primario" type="submit">Guardar</button>
      </form>
      <form class="tarjeta form-grid" data-form="nueva-area">
        <h2 style="grid-column:1/-1">Áreas</h2>
        <label>Nueva área<input name="nombre" required /></label>
        <div><button class="btn btn--primario" type="submit">Agregar área</button></div>
      </form>
      ${tabla(["Área", "Preventivo", "Activa", ""], filas, "Sin áreas.")}
    </section>
  `;
}

async function paginaHojas(id) {
  if (!state.org) return `<p class="aviso">Sin empresa.</p>`;
  if (id) {
    const { data: hoja, error } = await supabase.from("hojas_vida").select("*").eq("id", id).maybeSingle();
    throwIf(error);
    if (!hoja) return `<p class="mensaje-vacio">Equipo no encontrado.</p>`;
    const [{ data: pm }, { data: corr }] = await Promise.all([
      supabase.from("preventivo").select("*").eq("hoja_id", hoja.id).order("fecha", { ascending: false }),
      supabase.from("correctivo").select("*").eq("organizacion_id", state.org.id).order("fecha", { ascending: false }),
    ]);
    return `
      <section class="panel">
        <a href="#/app/hojas-de-vida">← Hojas de vida</a>
        <h1>${esc(hoja.nombre)}</h1>
        <form class="tarjeta form-grid" data-form="guardar-hoja" data-id="${hoja.id}">
          <label>Nombre<input name="nombre" value="${esc(hoja.nombre)}" /></label>
          <label>Código<input name="codigo" value="${esc(hoja.codigo || "")}" /></label>
          <label>Área<select name="area">${opcionesAreas(hoja.area)}</select></label>
          <label>Frecuencia PM (meses)<input name="frecuencia" value="${esc(hoja.frecuencia_pm_meses || "")}" /></label>
          ${puede(state.perfil?.rol, "editar.hojas") ? `<div><button class="btn btn--primario" type="submit">Guardar</button></div>` : ""}
        </form>
        <div class="tarjeta"><h2>Historial preventivo</h2><ul>${(pm || []).map((i) => `<li>${esc(i.fecha)} · ${esc(i.descripcion || "PM")}</li>`).join("") || "<p class='mensaje-vacio'>Sin preventivos.</p>"}</ul></div>
        <div class="tarjeta"><h2>Correctivo</h2><ul>${(corr || []).filter((i) => i.datos?.equipo === hoja.nombre || i.area === hoja.area).map((i) => `<li>${esc(i.fecha)} · ${esc(i.datos?.descripcion || "")}</li>`).join("") || "<p class='mensaje-vacio'>Sin intervenciones.</p>"}</ul></div>
      </section>
    `;
  }
  const { data, error } = await supabase.from("hojas_vida").select("*").eq("organizacion_id", state.org.id).order("nombre");
  throwIf(error);
  return `
    <section class="panel">
      <h1>Hojas de vida</h1>
      <p class="panel__descripcion">Equipos y máquinas de ${esc(state.org.nombre)}.</p>
      ${aviso(state.error)}
      ${
        puede(state.perfil?.rol, "editar.hojas")
          ? `<form class="tarjeta form-grid" data-form="crear-hoja">
              <label>Nombre<input name="nombre" required /></label>
              <label>Código<input name="codigo" /></label>
              <label>Área<select name="area">${opcionesAreas()}</select></label>
              <label>Frecuencia PM (meses)<input name="frecuencia" type="number" min="1" value="1" /></label>
              <div><button class="btn btn--primario" type="submit">Agregar equipo</button></div>
            </form>`
          : ""
      }
      ${cards(
        (data || []).map(
          (h) => `<article class="tarjeta"><h2>${esc(h.nombre)}</h2>
            <p class="panel__descripcion">${esc(h.codigo || "Sin código")} · ${esc(h.area)}</p>
            <p>PM cada ${esc(h.frecuencia_pm_meses || "—")} mes(es)</p>
            <div class="acciones-fila">
              <a class="btn" href="#/app/hojas-de-vida/${h.id}">Abrir</a>
              ${puede(state.perfil?.rol, "eliminar.registros") ? `<button class="btn btn--peligro" data-act="borrar-hoja" data-id="${h.id}">Eliminar</button>` : ""}
            </div></article>`,
        ),
        "Aún no hay equipos.",
      )}
    </section>
  `;
}

async function paginaPreventivo() {
  const { data, error } = await supabase.from("preventivo").select("*").eq("organizacion_id", state.org.id).order("fecha", { ascending: false });
  throwIf(error);
  const { data: hojas } = await supabase.from("hojas_vida").select("id,nombre,area").eq("organizacion_id", state.org.id).order("nombre");
  const filas = (data || [])
    .map(
      (i) => `<tr><td>${esc(i.fecha)}</td><td>${esc(i.area)}</td><td>${esc(i.datos?.equipo || "—")}</td><td>${esc(i.descripcion)}</td>
        <td><span class="estado estado--${esc(i.datos?.estado || "pendiente")}">${esc(i.datos?.estado || "pendiente")}</span></td>
        <td>${puede(state.perfil?.rol, "eliminar.registros") ? `<button class="btn btn--peligro" data-act="borrar-pm" data-id="${i.id}">Borrar</button>` : ""}</td></tr>`,
    )
    .join("");
  return `
    <section class="panel">
      <h1>Mantenimiento preventivo</h1>
      <p class="panel__descripcion">Registra la ejecución de PM. El líder o admin aprueba.</p>
      ${
        puede(state.perfil?.rol, "crear.preventivo")
          ? `<form class="tarjeta form-grid" data-form="crear-pm">
              <label>Equipo<select name="hoja_id"><option value="">—</option>${(hojas || []).map((h) => `<option value="${h.id}" data-area="${esc(h.area)}">${esc(h.nombre)}</option>`).join("")}</select></label>
              <label>Área<select name="area">${opcionesAreas()}</select></label>
              <label>Fecha<input type="date" name="fecha" value="${hoy()}" /></label>
              <label>Trabajo realizado<input name="descripcion" required /></label>
              <div><button class="btn btn--primario" type="submit">Registrar PM</button></div>
            </form>`
          : ""
      }
      ${tabla(["Fecha", "Área", "Equipo", "Descripción", "Estado", ""], filas, "Sin registros de preventivo.")}
    </section>
  `;
}

async function paginaAprobar() {
  const { data, error } = await supabase.from("preventivo").select("*").eq("organizacion_id", state.org.id);
  throwIf(error);
  const pend = (data || []).filter((i) => (i.datos?.estado || "") === "pendiente_aprobacion");
  return `
    <section class="panel">
      <h1>Aprobar preventivo</h1>
      <p class="panel__descripcion">PM pendientes de firma del líder o administrador.</p>
      ${cards(
        pend.map(
          (i) => `<article class="tarjeta"><h2>${esc(i.datos?.equipo || i.area)}</h2><p>${esc(i.fecha)} · ${esc(i.descripcion)}</p>
            ${puede(state.perfil?.rol, "aprobar.preventivo") ? `<button class="btn btn--primario" data-act="aprobar-pm" data-id="${i.id}">Aprobar y firmar</button>` : ""}</article>`,
        ),
        "No hay PM pendientes de aprobación.",
      )}
    </section>
  `;
}

async function paginaCronograma() {
  const mes = periodoMes();
  const [anio, mesNum] = mes.split("-").map(Number);
  const desde = `${mes}-01`;
  const ultimo = new Date(anio, mesNum, 0).getDate();
  const hasta = `${mes}-${String(ultimo).padStart(2, "0")}`;
  const [{ data: citas }, { data: hojas }] = await Promise.all([
    supabase.from("cronograma").select("*").eq("organizacion_id", state.org.id).gte("fecha", desde).lte("fecha", hasta).order("fecha"),
    supabase.from("hojas_vida").select("id,nombre").eq("organizacion_id", state.org.id).eq("activa", true),
  ]);
  const nombre = (id) => (hojas || []).find((h) => h.id === id)?.nombre || id;
  const filas = (citas || []).map((c) => `<tr><td>${esc(c.fecha)}</td><td>${esc(nombre(c.hoja_id))}</td></tr>`).join("");
  return `
    <section class="panel">
      <h1>Cronograma preventivo</h1>
      ${
        puede(state.perfil?.rol, "crear.preventivo")
          ? `<form class="tarjeta form-grid" data-form="cita-cronograma">
              <label>Equipo<select name="hoja_id" required>${(hojas || []).map((h) => `<option value="${h.id}">${esc(h.nombre)}</option>`).join("")}</select></label>
              <label>Fecha<input type="date" name="fecha" value="${hoy()}" /></label>
              <div><button class="btn btn--primario" type="submit">Agregar cita</button></div>
            </form>`
          : ""
      }
      ${tabla(["Fecha", "Equipo"], filas, "Sin citas en este mes.")}
    </section>
  `;
}

async function paginaSolicitudes() {
  const { data, error } = await supabase.from("correctivo").select("*").eq("organizacion_id", state.org.id).order("fecha", { ascending: false });
  throwIf(error);
  const lista = (data || []).filter((i) => (i.datos?.tipo || "solicitud") === "solicitud");
  return `
    <section class="panel">
      <h1>Solicitudes de correctivo</h1>
      <p class="panel__descripcion">Reporta fallas por área. Mantenimiento toma y cierra la solicitud.</p>
      ${
        puede(state.perfil?.rol, "crear.solicitudes")
          ? `<form class="tarjeta form-stack" data-form="crear-solicitud">
              <div class="form-grid">
                <label>Área<select name="area">${opcionesAreas()}</select></label>
                <label>Equipo / ubicación<input name="equipo" /></label>
              </div>
              <label>Descripción de la falla<textarea name="descripcion" required></textarea></label>
              <button class="btn btn--primario" type="submit">Crear solicitud</button>
            </form>`
          : ""
      }
      ${cards(
        lista.map((i) => {
          const est = i.datos?.estado || "abierta";
          return `<article class="tarjeta"><span class="estado estado--${esc(est)}">${esc(est)}</span>
            <h2>${esc(i.area)}</h2><p>${esc(i.datos?.equipo)}</p><p>${esc(i.datos?.descripcion)}</p>
            <p class="panel__descripcion">${esc(i.fecha)} · ${esc(i.datos?.solicitante)}</p>
            <div class="acciones-fila">
              ${puede(state.perfil?.rol, "crear.correctivo") && est === "abierta" ? `<button class="btn" data-act="sol-estado" data-id="${i.id}" data-estado="en_proceso">Tomar</button>` : ""}
              ${puede(state.perfil?.rol, "crear.correctivo") && est !== "cerrada" ? `<button class="btn btn--primario" data-act="sol-estado" data-id="${i.id}" data-estado="cerrada">Cerrar</button>` : ""}
            </div></article>`;
        }),
        "No hay solicitudes.",
      )}
    </section>
  `;
}

async function paginaCorrectivo() {
  const { data, error } = await supabase.from("correctivo").select("*").eq("organizacion_id", state.org.id).order("fecha", { ascending: false });
  throwIf(error);
  const hist = (data || []).filter((i) => i.datos?.tipo === "historico");
  const filas = hist
    .map((i) => `<tr><td>${esc(i.fecha)}</td><td>${esc(i.area)}</td><td>${esc(i.datos?.equipo)}</td><td>${esc(i.datos?.intervencion || i.datos?.descripcion)}</td></tr>`)
    .join("");
  return `
    <section class="panel">
      <h1>Mantenimiento correctivo</h1>
      <p class="panel__descripcion">Historial de intervenciones ya ejecutadas.</p>
      ${
        puede(state.perfil?.rol, "crear.correctivo")
          ? `<form class="tarjeta form-stack" data-form="crear-correctivo">
              <div class="form-grid">
                <label>Área<select name="area">${opcionesAreas()}</select></label>
                <label>Equipo<input name="equipo" /></label>
              </div>
              <label>Intervención<textarea name="intervencion" required></textarea></label>
              <button class="btn btn--primario" type="submit">Registrar correctivo</button>
            </form>`
          : ""
      }
      ${tabla(["Fecha", "Área", "Equipo", "Intervención"], filas, "Sin historial correctivo.")}
    </section>
  `;
}

async function paginaIndicadores() {
  const periodo = periodoMes();
  const [{ data: pm }, { data: corr }, { data: nc }, { data: horas }] = await Promise.all([
    supabase.from("preventivo").select("fecha").eq("organizacion_id", state.org.id),
    supabase.from("correctivo").select("datos").eq("organizacion_id", state.org.id),
    supabase.from("no_conformidades").select("datos").eq("organizacion_id", state.org.id),
    supabase.from("horas_programadas").select("*").eq("organizacion_id", state.org.id).eq("periodo", periodo),
  ]);
  const pmMes = (pm || []).filter((i) => i.fecha.startsWith(periodo)).length;
  const abiertas = (corr || []).filter((i) => (i.datos?.tipo || "solicitud") === "solicitud" && i.datos?.estado !== "cerrada").length;
  const ncAbiertas = (nc || []).filter((i) => (i.datos?.estado || "abierta") !== "cerrada").length;
  const mapa = Object.fromEntries((horas || []).map((h) => [h.area, h.horas]));
  const total = Object.values(mapa).reduce((a, v) => a + Number(v || 0), 0);
  return `
    <section class="panel">
      <h1>Indicadores</h1>
      <p class="panel__descripcion">Periodo ${esc(periodo)}.</p>
      <div class="rejilla-cards">
        <article class="tarjeta kpi"><span>PM del mes</span><strong>${pmMes}</strong></article>
        <article class="tarjeta kpi"><span>Horas programadas</span><strong>${total}</strong></article>
        <article class="tarjeta kpi"><span>Solicitudes abiertas</span><strong>${abiertas}</strong></article>
        <article class="tarjeta kpi"><span>No conformidades abiertas</span><strong>${ncAbiertas}</strong></article>
      </div>
      ${
        puede(state.perfil?.rol, "editar.indicadores")
          ? `<form class="tarjeta form-stack" data-form="horas">
              <h2>Horas programadas por área</h2>
              <div class="form-grid">${state.areas
                .filter((a) => a.activa)
                .map((a) => `<label>${esc(a.nombre)}<input type="number" min="0" name="hora-${esc(a.nombre)}" value="${esc(mapa[a.nombre] ?? "")}" /></label>`)
                .join("")}</div>
              <button class="btn btn--primario" type="submit">Guardar horas</button>
            </form>`
          : ""
      }
    </section>
  `;
}

async function paginaCalidad(tipo) {
  const metas = {
    nc: { tabla: "no_conformidades", titulo: "No conformidades", desc: "Hallazgos, análisis de causa y acciones correctivas (CAPA)." },
    mejora: { tabla: "acciones_mejora", titulo: "Acciones de mejora", desc: "Oportunidades de mejora y seguimiento del plan." },
    cambio: { tabla: "gestion_cambio", titulo: "Gestión del cambio", desc: "Cambios de proceso, equipo o sistema con impacto en el SGC." },
  };
  if (!tipo) {
    const [nc, mejora, cambio] = await Promise.all([
      supabase.from("no_conformidades").select("id", { count: "exact", head: true }).eq("organizacion_id", state.org.id),
      supabase.from("acciones_mejora").select("id", { count: "exact", head: true }).eq("organizacion_id", state.org.id),
      supabase.from("gestion_cambio").select("id", { count: "exact", head: true }).eq("organizacion_id", state.org.id),
    ]);
    return `
      <section class="panel">
        <h1>Calidad</h1>
        <p class="panel__descripcion">Módulos SGC genéricos. Cada empresa usa sus procesos.</p>
        <div class="rejilla-cards">
          <article class="tarjeta"><h2>No conformidades</h2><p>${nc.count ?? 0} registros</p><a class="btn btn--primario" href="#/app/calidad/nc">Abrir</a></article>
          <article class="tarjeta"><h2>Acciones de mejora</h2><p>${mejora.count ?? 0} registros</p><a class="btn btn--primario" href="#/app/calidad/mejora">Abrir</a></article>
          <article class="tarjeta"><h2>Gestión del cambio</h2><p>${cambio.count ?? 0} registros</p><a class="btn btn--primario" href="#/app/calidad/cambio">Abrir</a></article>
        </div>
      </section>
    `;
  }
  const meta = metas[tipo] || metas.nc;
  const { data, error } = await supabase.from(meta.tabla).select("*").eq("organizacion_id", state.org.id).order("numero", { ascending: false });
  throwIf(error);
  return `
    <section class="panel">
      <a href="#/app/calidad">← Calidad</a>
      <h1>${esc(meta.titulo)}</h1>
      <p class="panel__descripcion">${esc(meta.desc)}</p>
      ${
        puede(state.perfil?.rol, "crear.calidad")
          ? `<form class="tarjeta form-grid" data-form="crear-calidad" data-tabla="${meta.tabla}">
              <label>Título<input name="titulo" required /></label>
              <label>Área / proceso<select name="area"><option value="">General</option>${opcionesAreas()}</select></label>
              <div><button class="btn btn--primario" type="submit">Registrar</button></div>
            </form>`
          : ""
      }
      ${cards(
        (data || []).map(
          (i) => `<article class="tarjeta"><span class="estado estado--${esc(i.datos?.estado || "abierta")}">${esc(i.datos?.estado || "abierta")}</span>
            <h2>#${i.numero} · ${esc(i.datos?.titulo || "Sin título")}</h2>
            <p class="panel__descripcion">${esc(i.datos?.area || "General")}</p>
            <div class="acciones-fila">
              ${puede(state.perfil?.rol, "crear.calidad") && i.datos?.estado !== "cerrada" ? `<button class="btn" data-act="cerrar-calidad" data-tabla="${meta.tabla}" data-id="${i.id}">Cerrar</button>` : ""}
              ${puede(state.perfil?.rol, "eliminar.registros") ? `<button class="btn btn--peligro" data-act="borrar-calidad" data-tabla="${meta.tabla}" data-id="${i.id}">Eliminar</button>` : ""}
            </div></article>`,
        ),
        "Sin registros.",
      )}
    </section>
  `;
}

async function paginaPersonal() {
  const { data, error } = await supabase.from("personal").select("*").eq("organizacion_id", state.org.id).order("nombre");
  throwIf(error);
  const filas = (data || [])
    .map(
      (p) => `<tr><td>${esc(p.nombre)}</td><td>${esc(p.cargo)}</td><td>${esc(p.area)}</td>
        <td>${puede(state.perfil?.rol, "editar.personal") ? `<button class="btn" data-act="toggle-persona" data-id="${p.id}" data-activo="${p.activo ? "0" : "1"}">${p.activo ? "Activo" : "Inactivo"}</button>` : p.activo ? "Activo" : "Inactivo"}</td></tr>`,
    )
    .join("");
  return `
    <section class="panel">
      <div class="panel__cabecera"><div><h1>Personal</h1><p class="panel__descripcion">Directorio de la empresa.</p></div>
      <a class="btn" href="#/app/personal/usuarios">Usuarios del portal</a></div>
      ${
        puede(state.perfil?.rol, "editar.personal")
          ? `<form class="tarjeta form-grid" data-form="crear-persona">
              <label>Nombre<input name="nombre" required /></label>
              <label>Cargo<input name="cargo" /></label>
              <label>Área<select name="area"><option value="">—</option>${opcionesAreas()}</select></label>
              <div><button class="btn btn--primario" type="submit">Agregar</button></div>
            </form>`
          : ""
      }
      ${tabla(["Nombre", "Cargo", "Área", "Estado"], filas, "Sin personal.")}
    </section>
  `;
}

async function paginaUsuarios() {
  if (!puede(state.perfil?.rol, "gestionar.usuarios") || !state.org) {
    return `<p class="aviso">No tienes permiso para gestionar usuarios.</p>`;
  }
  const { data, error } = await supabase.from("usuarios_portal").select("*").eq("organizacion_id", state.org.id).order("nombre");
  throwIf(error);
  const filas = (data || [])
    .map(
      (u) => `<tr><td>${esc(u.usuario)}</td><td>${esc(u.nombre)}</td><td>${esc(etiquetaRol(u.rol))}</td><td>${esc(u.area)}</td>
        <td><button class="btn" data-act="toggle-usuario" data-id="${u.id}" data-activo="${u.activo ? "0" : "1"}">${u.activo ? "Desactivar" : "Activar"}</button></td></tr>`,
    )
    .join("");
  return `
    <section class="panel">
      <h1>Usuarios del portal</h1>
      <p class="panel__descripcion">El login es usuario + slug. Requiere la Edge Function <code>crear-usuario</code>.</p>
      ${aviso(state.error)}
      <form class="tarjeta form-grid" data-form="crear-usuario">
        <label>Usuario<input name="usuario" required /></label>
        <label>Nombre<input name="nombre" required /></label>
        <label>Contraseña<input name="password" type="password" required /></label>
        <label>Rol<select name="rol">${ROLES_EMPRESA.map((r) => `<option value="${r}">${esc(etiquetaRol(r))}</option>`).join("")}</select></label>
        <label>Área<select name="area"><option value="">—</option>${opcionesAreas()}</select></label>
        <div><button class="btn btn--primario" type="submit">Crear usuario</button></div>
      </form>
      ${tabla(["Usuario", "Nombre", "Rol", "Área", ""], filas, "Sin usuarios.")}
    </section>
  `;
}

async function contenidoApp(path) {
  const permiso = permisoRuta(path);
  if (permiso && !puede(state.perfil?.rol, permiso)) {
    location.hash = rutaInicio(state.perfil?.rol).slice(1);
    return `<p class="aviso">Redirigiendo…</p>`;
  }
  if (path.startsWith("/app/preventivo") || path.startsWith("/app/correctivo") || path.startsWith("/app/solicitudes") || path.startsWith("/app/hojas") || path.startsWith("/app/indicadores")) {
    if (state.org && !moduloActivo(state.org.modulos, "mantenimiento")) {
      return `<p class="aviso">El módulo de mantenimiento no está activo para tu empresa.</p>`;
    }
  }
  if (path.startsWith("/app/calidad") && state.org && !moduloActivo(state.org.modulos, "calidad")) {
    return `<p class="aviso">El módulo de calidad no está activo para tu empresa.</p>`;
  }
  if (path === "/app") return paginaInicio();
  if (path === "/app/empresas") return paginaEmpresas();
  if (path === "/app/configuracion") return paginaConfiguracion();
  if (path === "/app/personal") return paginaPersonal();
  if (path === "/app/personal/usuarios") return paginaUsuarios();
  if (path === "/app/preventivo") return paginaPreventivo();
  if (path === "/app/preventivo/aprobaciones") return paginaAprobar();
  if (path === "/app/preventivo/cronograma") return paginaCronograma();
  if (path === "/app/correctivo") return paginaCorrectivo();
  if (path === "/app/solicitudes") return paginaSolicitudes();
  if (path.startsWith("/app/hojas-de-vida/")) return paginaHojas(path.split("/").pop());
  if (path === "/app/hojas-de-vida") return paginaHojas();
  if (path === "/app/indicadores") return paginaIndicadores();
  if (path === "/app/calidad") return paginaCalidad();
  if (path.startsWith("/app/calidad/")) return paginaCalidad(path.split("/").pop());
  return `<p class="aviso">Ruta no encontrada.</p>`;
}

async function pintar() {
  const path = rutaActual();
  try {
    if (path === "/" || path === "") {
      root.innerHTML = landingHtml();
      document.body.style.background = "#0b1220";
      return;
    }
    document.body.style.background = "";
    if (path === "/login") {
      if (state.session && state.perfil) {
        location.hash = rutaInicio(state.perfil.rol).slice(1);
        return;
      }
      root.innerHTML = loginHtml();
      return;
    }
    if (path.startsWith("/app")) {
      if (!configurado) {
        root.innerHTML = loginHtml();
        return;
      }
      if (state.cargando) {
        root.innerHTML = `<div class="carga-pantalla carga-pantalla--completa"><div class="carga-pantalla__spinner"></div><p>Verificando sesión…</p></div>`;
        return;
      }
      if (!state.session || !state.perfil) {
        location.hash = "/login";
        return;
      }
      const inner = await contenidoApp(path);
      root.innerHTML = layout(inner);
      return;
    }
    root.innerHTML = landingHtml();
  } catch (e) {
    root.innerHTML = `<div class="carga-pantalla carga-pantalla--completa"><h1>Algo falló</h1><p>${esc(e.message)}</p><button class="btn btn--primario" onclick="location.reload()">Recargar</button></div>`;
  }
}

async function recargarYPintar() {
  state.cargando = true;
  await cargarSesion();
  await pintar();
}

root.addEventListener("click", async (evento) => {
  const btn = evento.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  try {
    if (act === "salir") {
      await supabase.auth.signOut({ scope: "local" });
      state.session = null;
      state.perfil = null;
      location.hash = "/login";
      return;
    }
    if (act === "mas") document.getElementById("mas-sheet")?.removeAttribute("hidden");
    if (act === "cerrar-mas") document.getElementById("mas-sheet")?.setAttribute("hidden", "");
    if (act === "toggle-org") {
      await supabase.from("organizaciones").update({ activa: btn.dataset.activa === "1" }).eq("id", btn.dataset.id);
      await pintar();
    }
    if (act === "area-pm") {
      await supabase.from("areas").update({ tiene_preventivo: btn.checked }).eq("id", btn.dataset.id);
      await recargarYPintar();
    }
    if (act === "area-activa") {
      await supabase.from("areas").update({ activa: btn.checked }).eq("id", btn.dataset.id);
      await recargarYPintar();
    }
    if (act === "area-borrar") {
      await supabase.from("areas").delete().eq("id", btn.dataset.id);
      await recargarYPintar();
    }
    if (act === "borrar-hoja") {
      await supabase.from("hojas_vida").delete().eq("id", btn.dataset.id);
      await pintar();
    }
    if (act === "borrar-pm") {
      await supabase.from("preventivo").delete().eq("id", btn.dataset.id);
      await pintar();
    }
    if (act === "aprobar-pm") {
      const { data } = await supabase.from("preventivo").select("datos").eq("id", btn.dataset.id).single();
      await supabase.from("preventivo").update({ datos: { ...(data?.datos || {}), estado: "aprobado", firma: true } }).eq("id", btn.dataset.id);
      await pintar();
    }
    if (act === "sol-estado") {
      const { data } = await supabase.from("correctivo").select("datos").eq("id", btn.dataset.id).single();
      await supabase.from("correctivo").update({ datos: { ...(data?.datos || {}), estado: btn.dataset.estado } }).eq("id", btn.dataset.id);
      await pintar();
    }
    if (act === "cerrar-calidad") {
      const { data } = await supabase.from(btn.dataset.tabla).select("datos").eq("id", btn.dataset.id).single();
      await supabase.from(btn.dataset.tabla).update({ datos: { ...(data?.datos || {}), estado: "cerrada" } }).eq("id", btn.dataset.id);
      await pintar();
    }
    if (act === "borrar-calidad") {
      await supabase.from(btn.dataset.tabla).delete().eq("id", btn.dataset.id);
      await pintar();
    }
    if (act === "toggle-persona") {
      await supabase.from("personal").update({ activo: btn.dataset.activo === "1" }).eq("id", btn.dataset.id);
      await pintar();
    }
    if (act === "toggle-usuario") {
      await supabase.from("usuarios_portal").update({ activo: btn.dataset.activo === "1" }).eq("id", btn.dataset.id);
      await pintar();
    }
  } catch (e) {
    state.error = e.message;
    await pintar();
  }
});

root.addEventListener("submit", async (evento) => {
  const form = evento.target.closest("[data-form]");
  if (!form) return;
  evento.preventDefault();
  const fd = new FormData(form);
  const tipo = form.dataset.form;
  state.error = null;
  try {
    if (tipo === "login") {
      const login = String(fd.get("usuario") || "").trim().toLowerCase();
      const slug = slugificar(String(fd.get("slug") || ""));
      const password = String(fd.get("password") || "");
      const { data, error } = await supabase.rpc("email_auth_por_login", { p_login: login, p_slug: slug || null });
      const email = !error && typeof data === "string" && data.trim() ? data.trim() : login.includes("@") ? login : `${login}@${slug}.miempresa.local`;
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      await recargarYPintar();
      location.hash = rutaInicio(state.perfil?.rol).slice(1);
      return;
    }
    if (tipo === "crear-empresa") {
      const nombre = String(fd.get("nombre") || "").trim();
      const slug = slugificar(String(fd.get("slug") || nombre));
      const { data: org, error } = await supabase
        .from("organizaciones")
        .insert({ nombre, slug, color: "#2563eb", modulos: { mantenimiento: true, calidad: true } })
        .select("*")
        .single();
      throwIf(error);
      const pass = String(fd.get("admin_password") || "");
      if (pass) {
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
        if (fnError) throw new Error("Empresa creada. El admin no se pudo crear (despliega la función crear-usuario). " + fnError.message);
        if (fnData?.error) throw new Error(fnData.error);
      }
    }
    if (tipo === "guardar-marca" && state.org) {
      let logo_url = state.org.logo_url;
      const archivo = fd.get("logo");
      if (archivo && archivo.size) {
        const ext = (archivo.name.split(".").pop() || "png").toLowerCase();
        const ruta = `${state.org.id}/logo.${ext}`;
        const { error } = await supabase.storage.from("adjuntos").upload(ruta, archivo, { upsert: true, contentType: archivo.type || "image/png" });
        throwIf(error);
        logo_url = `${supabase.storage.from("adjuntos").getPublicUrl(ruta).data.publicUrl}?t=${Date.now()}`;
      }
      const { error } = await supabase.from("organizaciones").update({
        nombre: String(fd.get("nombre") || "").trim(),
        color: String(fd.get("color") || "#2563eb"),
        logo_url,
        modulos: { mantenimiento: fd.get("mantenimiento") === "on", calidad: fd.get("calidad") === "on" },
      }).eq("id", state.org.id);
      throwIf(error);
      await recargarYPintar();
      return;
    }
    if (tipo === "nueva-area" && state.org) {
      const { error } = await supabase.from("areas").insert({ organizacion_id: state.org.id, nombre: String(fd.get("nombre") || "").trim() });
      throwIf(error);
      await recargarYPintar();
      return;
    }
    if (tipo === "crear-hoja" && state.org) {
      const { error } = await supabase.from("hojas_vida").insert({
        organizacion_id: state.org.id,
        nombre: String(fd.get("nombre") || "").trim(),
        codigo: String(fd.get("codigo") || "") || null,
        area: String(fd.get("area") || state.areas[0]?.nombre || "General"),
        frecuencia_pm_meses: Number(fd.get("frecuencia")) || null,
      });
      throwIf(error);
    }
    if (tipo === "guardar-hoja") {
      const { error } = await supabase.from("hojas_vida").update({
        nombre: String(fd.get("nombre") || "").trim(),
        codigo: String(fd.get("codigo") || ""),
        area: String(fd.get("area") || ""),
        frecuencia_pm_meses: Number(fd.get("frecuencia")) || null,
        actualizado_en: new Date().toISOString(),
      }).eq("id", form.dataset.id);
      throwIf(error);
    }
    if (tipo === "crear-pm" && state.org) {
      const hojaId = String(fd.get("hoja_id") || "") || null;
      const sel = form.querySelector(`[name="hoja_id"] option:checked`);
      const { error } = await supabase.from("preventivo").insert({
        organizacion_id: state.org.id,
        hoja_id: hojaId,
        area: String(fd.get("area") || "") || sel?.dataset.area || "General",
        fecha: String(fd.get("fecha") || hoy()),
        descripcion: String(fd.get("descripcion") || "").trim(),
        datos: { estado: "pendiente_aprobacion", equipo: sel?.textContent || "" },
      });
      throwIf(error);
    }
    if (tipo === "cita-cronograma" && state.org) {
      const { error } = await supabase.from("cronograma").insert({
        organizacion_id: state.org.id,
        hoja_id: String(fd.get("hoja_id")),
        fecha: String(fd.get("fecha") || hoy()),
      });
      throwIf(error);
    }
    if (tipo === "crear-solicitud" && state.org) {
      const { error } = await supabase.from("correctivo").insert({
        organizacion_id: state.org.id,
        area: String(fd.get("area") || "General"),
        fecha: hoy(),
        datos: {
          tipo: "solicitud",
          estado: "abierta",
          equipo: String(fd.get("equipo") || ""),
          descripcion: String(fd.get("descripcion") || ""),
          solicitante: state.perfil?.nombre || state.perfil?.usuario,
        },
      });
      throwIf(error);
    }
    if (tipo === "crear-correctivo" && state.org) {
      const { error } = await supabase.from("correctivo").insert({
        organizacion_id: state.org.id,
        area: String(fd.get("area") || "General"),
        fecha: hoy(),
        datos: {
          tipo: "historico",
          estado: "cerrada",
          equipo: String(fd.get("equipo") || ""),
          intervencion: String(fd.get("intervencion") || ""),
          descripcion: String(fd.get("intervencion") || ""),
        },
      });
      throwIf(error);
    }
    if (tipo === "horas" && state.org) {
      const periodo = periodoMes();
      await Promise.all(
        state.areas
          .filter((a) => a.activa)
          .map((a) =>
            supabase.from("horas_programadas").upsert(
              { organizacion_id: state.org.id, periodo, area: a.nombre, horas: Number(fd.get(`hora-${a.nombre}`)) || 0 },
              { onConflict: "organizacion_id,periodo,area" },
            ),
          ),
      );
    }
    if (tipo === "crear-calidad" && state.org) {
      const { error } = await supabase.from(form.dataset.tabla).insert({
        organizacion_id: state.org.id,
        datos: { titulo: String(fd.get("titulo") || "").trim(), area: String(fd.get("area") || ""), estado: "abierta" },
      });
      throwIf(error);
    }
    if (tipo === "crear-persona" && state.org) {
      const { error } = await supabase.from("personal").insert({
        organizacion_id: state.org.id,
        nombre: String(fd.get("nombre") || "").trim(),
        cargo: String(fd.get("cargo") || "") || null,
        area: String(fd.get("area") || "") || null,
      });
      throwIf(error);
    }
    if (tipo === "crear-usuario" && state.org) {
      const { error, data } = await supabase.functions.invoke("crear-usuario", {
        body: {
          organizacion_id: state.org.id,
          slug: state.org.slug,
          usuario: String(fd.get("usuario") || ""),
          nombre: String(fd.get("nombre") || ""),
          password: String(fd.get("password") || ""),
          rol: String(fd.get("rol") || "operador"),
          area: String(fd.get("area") || "") || null,
        },
      });
      if (error) throw new Error("Despliega la Edge Function crear-usuario. " + error.message);
      if (data?.error) throw new Error(data.error);
    }
    await recargarYPintar();
  } catch (e) {
    state.error = e.message;
    await pintar();
  }
});

window.addEventListener("hashchange", () => {
  void pintar();
});

await cargarSesion();
if (!location.hash) location.hash = "/";
await pintar();
