# Esquema en estrella — BI_DESPLIEGUES_Q1_2024

## Origen de datos

Sábana desnormalizada: `data/BI_DESPLIEGUES_Q1_2024.csv` (84 despliegues, trimestre **Q1 2024**).

### Dos CSV distintos (no confundirlos)

| Archivo | Columnas | Uso |
|---------|----------|-----|
| `BI_DESPLIEGUES_Q1_2024.csv` | ~50 (proyecto, repositorio, métricas, flags…) | **Cargar el data warehouse** (`pnpm db:import`) y entrega académica |
| `despliegues-trimestre.csv` | 11 (id, proyecto, ambiente, usuario…) | **Exportación del dashboard** (botón “Exportar CSV”) para revisar en Excel |

Si en Excel ves `GestiÃ³n` o `VÃ­ctor`, es codificación: el CSV está en UTF-8 pero Excel lo abrió como Latin-1.

**Cómo abrirlo bien en Excel**

1. Vuelve a exportar desde el dashboard (ya incluye BOM UTF-8), o  
2. Excel → **Datos** → **Desde texto/CSV** → elige el archivo → codificación **65001: Unicode (UTF-8)**.

**No uses** el CSV del dashboard para `pnpm db:import`; usa la sábana BI completa.

## Tablas

| Tipo | Tabla | Descripción |
|------|--------|-------------|
| Dimensión | `dim_proyecto` | Proyecto, repositorio, rama, estado |
| Dimensión | `dim_usuario` | Responsable, área, cargo, rol |
| Dimensión | `dim_ambiente` | Ambiente, criticidad, requiere aprobación |
| Dimensión | `dim_servidor` | Host, tipo, ruta, administrador |
| Dimensión | `dim_tiempo` | Fecha (PK), mes, semana, trimestre, año |
| Hechos | `fact_despliegue` | FK + métricas, flags y duraciones |

## Cargar en PostgreSQL / Supabase

```bash
pnpm install
pnpm db:import
```

Ejecuta `scripts/star-schema.sql` e importa el CSV.

## Django + DRF

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set DATABASE_URL=...   # o variables PG_*
python manage.py runserver 8000
```

- Modelos: `backend/despliegues/models.py` (`managed = False`, tablas ya creadas por SQL).
- API desnormalizada: `GET http://localhost:8000/api/facts/` con `select_related` en el serializador.

## Dashboard Next.js

Sigue usando `GET /api/dashboard` sobre el mismo esquema en estrella. Trimestre por defecto: **2024-Q1**.

## Dimensión tiempo

`id_tiempo` = fecha de **fecha_solicitud** (grano día). Para reportes por mes/trimestre use columnas de `dim_tiempo` o filtre por rango de fechas en `fact_despliegue`.
