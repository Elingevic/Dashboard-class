# Dashboard · Control de Despliegue de Software

Panel analítico en **Next.js 16** con datos reales desde **PostgreSQL**, alineado al proceso de negocio: despliegue a partir de un **commit validado**, con gobernanza y trazabilidad.

## Requisitos cumplidos

| Área | Implementación |
|------|----------------|
| **Trimestre** | Filtro obligatorio `2026-Q1` … `2026-Q4` (por defecto `2026-Q2`) |
| **KPIs** | Tasa de éxito, falla, rollback, cobertura evidencia, validación commit, aprobación |
| **Distribución** | Por estado (donut), ambiente y proyecto (barras), tendencia semanal |
| **Modelo** | `DESPLIEGUE` + `PROYECTO`, `AMBIENTE`, `SERVIDOR`, `USUARIO`, `EVIDENCIA`, `APROBACION`, `ROLLBACK` |
| **Gobernanza** | Vista dedicada + métricas de ambientes críticos sin aprobación |
| **Interactividad** | Clic en gráficos aplica filtros; exportación CSV |
| **Validación / Migración** | Mapeadas desde `commit_hash` y `fecha_fin` (ver nota en vista Gobernanza) |

## Inicio rápido

Este proyecto usa **pnpm** (no npm). Con [Corepack](https://nodejs.org/api/corepack.html) activado:

```bash
corepack enable
pnpm install
```

### 1. Base de datos local (PostgreSQL)

No hace falta un servidor remoto. En tu PC:

1. Instala [PostgreSQL](https://www.postgresql.org/download/) y crea la base `postgres` (o la que uses).
2. Copia el ejemplo de entorno:
   ```bash
   copy .env.example .env.local
   ```
3. Crea tablas + datos de prueba (15 despliegues, trimestre T2 2026):
   ```bash
   pnpm db:setup
   ```
   Equivalente manual: `psql -U postgres -d postgres -f scripts/database-model.sql`

- **Estructura de la BD (README):** [docs/README-BASE-DE-DATOS.md](docs/README-BASE-DE-DATOS.md)  
- **Diagrama ER:** [docs/MODELO-DATOS.md](docs/MODELO-DATOS.md)  
- **Script SQL:** `scripts/database-model.sql`

### 2. Dashboard

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

Comandos habituales: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm dev:webpack` (si Turbopack falla).

### Si aparece error de React Client Manifest

1. Detén todos los `next dev` (puertos 3000/3001).
2. Limpia e reinstala:
   ```bash
   pnpm clean
   corepack pnpm install
   corepack pnpm dev
   ```
3. Si persiste, usa Webpack: `pnpm dev:webpack`.

**Causa habitual:** `node_modules` mezclado (npm + pnpm) o un `package-lock.json` en `C:\Users\TecnoUsuario1\` que confunde a Turbopack. Este proyecto fija la raíz en `next.config.ts`.

La conexión se configura en `.env.local` (ver `.env.example`).

## Estructura

```
src/
  app/api/dashboard/route.ts   # Consultas analíticas
  app/page.tsx                 # Dashboard principal
  components/                  # Gráficos, filtros, tablas
  lib/
    db.ts                      # Pool y filtros SQL
    dashboard.ts               # Tipos y URLs
    estados.ts                 # Estados terminales / éxito / fallo
    trimestre.ts               # Definición de trimestres
scripts/
  inspect-schema.mjs           # Introspección de BD
  seed-trimestre.sql           # Verificación de datos Q2
```

## KPIs (fórmulas)

- **Tasa de éxito:** exitosos / despliegues terminales × 100  
- **Tasa de falla:** fallidos / despliegues terminales × 100  
- **Tasa de rollback:** despliegues con rollback / total × 100  
- **Cobertura evidencia:** con evidencia / total × 100  
- **Validación commit:** con `commit_hash` / total × 100  
- **Tasa aprobación:** con registro en `aprobacion` (decisión Aprobado) / total × 100  

## Nota de modelo

Las tablas `VALIDACION` y `MIGRACION` del diseño lógico no existen en esta BD. El dashboard las representa así:

- **Validación:** presencia de `commit_hash` en `despliegue`
- **Migración:** `fecha_fin` registrada; éxito de migración = despliegue exitoso con `fecha_fin`

## API

`GET /api/dashboard?trimestre=2026-Q2&estado=&ambiente=&proyecto=&busqueda=`

Respuesta: `kpis`, `estadosDespliegue`, `volumenPorAmbiente`, `volumenPorProyecto`, `tendenciaTemporal`, `gobernanza`, `despliegues`, `filtros`, etc.
