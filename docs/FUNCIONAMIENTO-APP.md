# Cómo funciona la app (Centro DevOps)

## Flujo de datos

1. El navegador carga la página (`/` → `DashboardApp`).
2. `fetch` a `GET /api/dashboard?trimestre=2024-Q1&...` con filtros.
3. La API consulta PostgreSQL (esquema en estrella: `fact_despliegue` + dimensiones).
4. Responde JSON con KPIs, gráficos, tabla y opciones de filtros.
5. React pinta la vista según la pestaña activa (Resumen, Analíticas, etc.).
    
## Capas

| Capa | Archivos |
|------|----------| 
| UI | `DashboardApp.tsx`, componentes en `src/components/` |
| API | `src/app/api/dashboard/route.ts` |
| SQL | `src/lib/db.ts`, `estados.ts`, `trimestre.ts` |
| BD | Supabase / PostgreSQL (`dim_*`, `fact_despliegue`) |

## Vistas

- **Resumen:** solo KPIs.
- **Analíticas:** KPIs + gráficos + rollbacks + evidencia.
- **Datos:** tabla / tarjetas de despliegues + export CSV.
- **Infraestructura / Seguridad / Gobernanza:** secciones especializadas.

Los filtros (trimestre, estado, ambiente, proyecto, búsqueda) recargan la API con debounce en búsqueda.

## Móvil (desde esta versión)

- Barra inferior: Resumen · Analíticas · Datos · Más.
- Menú lateral deslizable (hamburguesa o “Más”).
- Sin menú gigante arriba que tapaba el contenido.
- Tabla → tarjetas en pantallas &lt; 768px.
- Filtros colapsables (“Mostrar filtros”).
- `100dvh` + safe-area para iPhone.
- Un solo scroll en el panel principal.
