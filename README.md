# MiEmpresa

Portal multi-empresa de **mantenimiento** y **sistema de gestión de calidad**. Cada cliente (organización) tiene su marca, áreas y módulos; los datos no se mezclan.

Sitio comercial en `/`. El producto autenticado vive en `/app`.

## Stack

- React 19 + Vite + TypeScript
- Supabase (Postgres, Auth, Storage, RLS, Edge Functions)

## Arranque local

1. Copia `.env.example` a `.env` y pega URL y anon key de un proyecto **nuevo** de Supabase (no uses el de EPI).
2. En Supabase → SQL Editor, ejecuta [`supabase/schema.sql`](supabase/schema.sql).
3. Authentication → Users → crea tu usuario plataforma (correo real).
4. Inserta el perfil (cambia el UUID y el correo):

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

5. (Opcional) Despliega la función de alta de usuarios:

```bash
npx supabase functions deploy crear-usuario
```

6. Instala y corre:

```bash
npm install
npm run dev
```

Abre http://localhost:5500

## Cómo se acopla una empresa

1. Entra con la cuenta **plataforma**.
2. En **Empresas** crea el cliente (nombre + slug) y, si la función está desplegada, el admin inicial.
3. El admin entra en `/login` con **slug de empresa + usuario + contraseña**.
4. En **Configuración** carga logo, color, áreas y enciende o apaga mantenimiento / calidad.

El email interno de Auth es `{usuario}@{slug}.miempresa.local`. El personal no lo ve; escribe solo su usuario.

## Módulos actuales

- Mantenimiento: inicio por áreas, hojas de vida, preventivo, aprobación PM, cronograma, solicitudes, correctivo, indicadores.
- Calidad: no conformidades, acciones de mejora, gestión del cambio.

Siguientes (tipo Kawak): gestión documental, auditorías, riesgos, proveedores, PQRS.

## Repo

https://github.com/juanmmd9/MiEmpresa.git
