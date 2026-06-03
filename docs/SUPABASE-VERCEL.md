# Migrar la base de datos a Supabase y conectar Vercel

Sí: **Supabase es el lugar correcto** para alojar PostgreSQL. El dashboard en Vercel (`dashboard-class.vercel.app`) no migra datos por sí solo; solo necesita las **variables de entorno** que apunten a Supabase.

## Resumen en 4 pasos

| Paso | Dónde | Qué hacer |
|------|--------|-----------|
| 1 | Supabase → **SQL Editor** | Ejecutar `scripts/database-model.sql` (tablas + datos de prueba) |
| 2 | Supabase → **Connect** | Copiar URI del **Transaction pooler** (para Vercel) |
| 3 | Vercel → **Settings → Environment Variables** | Añadir `DATABASE_URL` con esa URI y tu contraseña |
| 4 | Vercel | **Redeploy** del proyecto |

---

## Paso 1: Crear tablas y datos en Supabase

Tienes dos opciones equivalentes.

### Opción A — SQL Editor (recomendada, sin instalar nada)

1. En [Supabase Dashboard](https://supabase.com/dashboard) abre tu proyecto (**Elingevic's Project**).
2. Menú izquierdo → **SQL Editor** → **New query**.
3. Abre en tu PC el archivo `scripts/database-model.sql`, copia **todo** el contenido y pégalo en el editor.
4. Pulsa **Run**.

Deberías ver tablas: `usuario`, `proyecto`, `ambiente`, `servidor`, `despliegue`, `aprobacion`, `rollback`, `evidencia`, con 15 despliegues de prueba (trimestre **2026-Q2**).

Comprueba en **Table Editor** que existen filas en `despliegue`.

### Opción B — Desde tu PC con `pnpm db:setup`

1. En Supabase → **Connect** → pestaña **Direct** (puerto **5432**).
2. Copia la URI y sustituye `[YOUR-PASSWORD]` por la contraseña de la base (la defines en **Project Settings → Database**).
3. En `.env.local` (solo en tu máquina, no subas este archivo a Git):

   ```env
   DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@db.buyjtlqxsuiqfagydaez.supabase.co:5432/postgres
   ```

4. Ejecuta:

   ```bash
   pnpm db:setup
   ```

Usa **Direct** solo para migrar desde tu PC. En Vercel usa el **pooler** (siguiente sección).

---

## Paso 2: Cadena de conexión correcta para Vercel

En la ventana **Connect to your project** de Supabase:

| Método | Cuándo usarlo |
|--------|----------------|
| **Direct** (5432) | PC local, `psql`, `pnpm db:setup` |
| **Transaction pooler** (6543) | **Vercel y serverless** — obligatorio en producción |
| **Session pooler** | Clientes que necesitan IPv4 o sesiones largas |

Para **Vercel**:

1. En **Connect**, elige **Transaction pooler**.
2. Tipo **URI**.
3. Copia la cadena (suele incluir `pooler.supabase.com` y puerto **6543**).
4. Sustituye `[YOUR-PASSWORD]` por la contraseña real del usuario `postgres`.

Ejemplo de forma (la tuya puede variar según región):

```text
postgresql://postgres.buyjtlqxsuiqfagydaez:TU_CONTRASEÑA@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

**No uses** la conexión Direct (`db.xxx.supabase.co:5432`) en Vercel: agota conexiones y puede fallar por IPv6.

---

## Paso 3: Variables en Vercel

1. [vercel.com](https://vercel.com) → proyecto **dashboard-class** (o el nombre que tengas).
2. **Settings** → **Environment Variables**.
3. Añade:

   | Nombre | Valor | Entornos |
   |--------|--------|----------|
   | `DATABASE_URL` | URI del **Transaction pooler** con contraseña | Production, Preview (opcional Development) |

No hace falta definir `PG_HOST`, `PG_PORT`, etc. si usas `DATABASE_URL`; la app lee primero `DATABASE_URL` (ver `src/lib/pg-config.ts`).

4. Guarda y ve a **Deployments** → los tres puntos del último deploy → **Redeploy**.

---

## Paso 4: Comprobar

1. Abre `https://dashboard-class.vercel.app`.
2. Debería cargar KPIs y gráficos (trimestre por defecto **2026-Q2**).
3. Si falla, en Vercel → **Deployments** → **Functions** / logs del deploy revisa errores de conexión o “relation does not exist” (falta ejecutar el SQL del paso 1).

---

## Desarrollo local con Supabase (opcional)

En `.env.local` puedes usar Direct para desarrollo:

```env
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@db.buyjtlqxsuiqfagydaez.supabase.co:5432/postgres
```

Luego `pnpm dev`. Para producción en Vercel mantén solo el pooler en las variables de Vercel, no en el repo.

---

## Errores frecuentes

| Síntoma | Causa | Solución |
|---------|--------|----------|
| `Unexpected end of JSON input` en el navegador | API sin BD o error no capturado | Configurar `DATABASE_URL` en Vercel y redeploy; ejecutar `database-model.sql` |
| `password authentication failed` | Contraseña incorrecta en la URI | Reset en Supabase → Database → **Reset database password** |
| `relation "despliegue" does not exist` | Schema no creado | Ejecutar `database-model.sql` en SQL Editor |
| Timeout / too many connections | Direct en serverless | Cambiar a **Transaction pooler** (6543) |
| IPv4 / not compatible | Red solo IPv4 | Usar **Session pooler** o add-on IPv4 en Supabase |

---

## Seguridad

- No subas `.env.local` ni contraseñas a GitHub.
- La contraseña de Supabase solo va en **Vercel Environment Variables** y en tu `.env.local` local.
- El archivo `.env.example` del repo solo muestra placeholders.
