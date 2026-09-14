# MiEmpresa

Portal multi-empresa de mantenimiento y sistema de gestión de calidad.

**No usa Vite ni npm.** El sitio es HTML, CSS y JavaScript estáticos en GitHub Pages. Los datos, el login y los archivos viven en Supabase.

Sitio: https://juanmmd9.github.io/MiEmpresa/

## Qué hay que configurar

### 1. Supabase (un proyecto nuevo, no el de EPI)

1. Crea el proyecto en [supabase.com](https://supabase.com).
2. SQL Editor → pega y ejecuta [`supabase/schema.sql`](supabase/schema.sql).
3. Authentication → Users → crea tu usuario plataforma (correo real).
4. Inserta el perfil (cambia UUID y correo):

```sql
insert into usuarios_portal (id, organizacion_id, usuario, email, nombre, rol, activo)
values (
  'UUID-DE-AUTH-USERS',
  null,
  'plataforma',
  'tu-correo@dominio.com',
  'Plataforma MiEmpresa',
  'plataforma',
  true
);
```

5. En [`js/config.js`](js/config.js) pega `Project URL` y `anon public` (Project Settings → API). Esas claves son públicas a propósito: la seguridad está en RLS.
6. (Opcional) Despliega la función de alta de usuarios desde el dashboard de Supabase → Edge Functions, carpeta [`supabase/functions/crear-usuario`](supabase/functions/crear-usuario).

### 2. GitHub Pages

En el repo: **Settings → Pages → Source: GitHub Actions**. Cada push a `main` publica el sitio.

También puedes elegir **Deploy from a branch → main → / (root)**.

## Cómo entra cada empresa

1. Tú entras con la cuenta plataforma (correo + contraseña, slug vacío).
2. En **Empresas** das de alta el cliente (nombre + slug).
3. El admin de esa empresa entra con **slug + usuario + contraseña**.
4. En **Configuración** carga logo, áreas y enciende mantenimiento / calidad.

## Ver el sitio en el PC

No hay `npm run dev`. Opciones:

- Abre la URL de GitHub Pages.
- En VS Code, extensión Live Server sobre `index.html`.
- O, si tienes Python: `python -m http.server` en esta carpeta.

## Repo

https://github.com/juanmmd9/MiEmpresa.git
