# StukoStore

Ecommerce por suscripción para tiendas bolivianas. Un catálogo deja de ser una
página de Google Sites con fotos sueltas y pasa a ser una tienda con inventario,
pedidos, equipo y automatizaciones.

- Sitio: https://store.stuko.dev
- Demo navegable: https://store.stuko.dev/demo/
- Repositorio: https://github.com/Stuko0/stukostore

## Estado

Fases 1 a 6 del plan completadas y verificadas con pruebas automatizadas
(67 comprobaciones, ver "Pruebas").

Lo que ya funciona:

- Portada del producto y página de precios con los cuatro planes en bolivianos.
- Tres tiendas de demostración con catálogo, colecciones, clientes, pedidos,
  cupones, zonas de envío y automatizaciones.
- Storefront por tienda: portada por bloques, categorías con filtros por
  etiqueta, precio, disponibilidad y orden, ficha de producto con galería de
  miniaturas, zoom al pasar el cursor y ampliación a pantalla completa,
  carrito, checkout con cupón, IVA y envío calculado, confirmación y
  seguimiento de pedido por código.
- Panel de administración con **acceso simulado por rol** (propietario,
  administrador, operador, lector): cada rol ve y puede hacer cosas distintas.
  Incluye resumen con métricas calculadas, catálogo con alta, edición, duplicado
  y archivado, inventario por ubicación con movimientos, pedidos con estados,
  notas, comprobante y devolución con reposición de stock, **editor de tema en
  vivo** con validación de contraste, y pantalla de plan y uso.
- Selector de plan colapsable presente en el storefront y en el panel: cambia la
  experiencia completa en el mismo frame, se refleja en la URL y en el
  navegador.
- Todo se guarda en el navegador del visitante (IndexedDB). No hay backend, no
  se envía nada a ningún servidor y el badge **DEMO** del encabezado lo explica
  en pantalla, con el botón para reiniciar los datos de fábrica.

Lo que todavía no está: contenido y tema editables en vivo (fase 8),
automatizaciones ejecutándose de verdad (fase 9), onboarding comercial (fase 10)
y el backend real en Go y SQLite (fase 12).

## Precios

Escenario premium, en bolivianos y con revisión anual.

| Plan | Bs/mes | USD aprox. | Para quién |
| --- | --- | --- | --- |
| ESCAPARATE | 0 | 0 | Catálogo con pedido por WhatsApp |
| TIENDA | 179 | 15 | Dominio propio, inventario, cupones, pago en línea |
| COMERCIO | 449 | 38 | Equipo, sucursales, envíos, devoluciones, automatizaciones |
| DISTRIBUIDOR | 990 | 84 | Multi-marca, API, webhooks, reportes, IA |

Referencias usadas: 1 USD ≈ 11,8 Bs y sueldo mínimo nacional de 3.300 Bs. El
plan más alto equivale al 30 % de un sueldo. El plan ESCAPARATE siempre lleva la
marca "Hecho con StukoStore" en el pie; desde TIENDA se puede quitar.

## Stack

| Pieza | Decisión |
| --- | --- |
| Framework | Astro 5, salida estática (95 páginas) |
| Interactividad | Islas SolidJS, una por componente interactivo |
| Estilos | CSS con custom properties, sin framework |
| Datos | Semillas JSON + IndexedDB tras la interfaz `StoreAPI` |
| Pruebas | Playwright, una sección por fase |
| Despliegue | GitHub Pages detrás del dominio propio |

La capa de datos se define tras una interfaz (`src/lib/api/index.ts`) con dos
implementaciones previstas: `MockAPI` (IndexedDB, la actual) y `HttpAPI` (Go +
SQLite, fase 12). Ningún componente importa semillas: todo pasa por la API.

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera dist/
npm run preview    # sirve dist/
npm run check      # typecheck de Astro y TypeScript

python3 scripts/build_seeds.py     # regenera las semillas JSON
python3 scripts/fetch_images.py    # vuelve a bajar las fotos de la demo

npx http-server dist -p 4400 -s &  # sirve el build
python3 tests/e2e/run.py           # pruebas contra http://localhost:4400
python3 tests/e2e/run.py https://store.stuko.dev   # pruebas contra producción
```

## Estructura

```
src/
  components/
    admin/      Panel: navegación, resumen, catálogo, inventario, pedidos, plan
    demo/       Selector de tienda de demostración
    store/      Storefront: bloques, grilla, ficha, carrito, checkout, seguimiento
    tier/       Barra de plan, puertas de plan y estados bloqueados
  data/seed/    Semillas JSON (tiendas, productos, pedidos, páginas, bloques)
  layouts/      Base (sitio), Storefront (tienda), Admin (panel)
  lib/
    api/        StoreAPI, IndexedDB, semillas y métricas
    format.ts   Moneda Bs.- y fechas
    store.ts    Estado compartido entre islas (plan, tienda, carrito)
    tiers.ts    Precios, límites y gating: fuente única
  pages/        Rutas del sitio, del storefront y del panel
tests/e2e/      Batería de pruebas por fase
scripts/        Generadores de semillas e imágenes
```

## Rutas

Público: `/`, `/precios`, `/demo`, `/404`.

Storefront por tienda: `/t/[tienda]`, `/c/[coleccion]`, `/p/[producto]`,
`/buscar`, `/carrito`, `/checkout`, `/pedido/?code=`, `/paginas/[slug]`.

Panel por tienda: `/admin/[tienda]`, `/pedidos`, `/pedidos/detalle/?id=`,
`/productos`, `/productos/nuevo`, `/productos/editar/?id=`, `/inventario`,
`/colecciones`, `/clientes`, `/automatizaciones`, `/plan`.

## Planes y límites

`src/lib/tiers.ts` es la fuente única de precios, límites y gating. Un plan se
compara por rango; `can(plan, funcion)` decide y `limitFor(plan, funcion)`
devuelve el tope. Los límites se aplican de verdad: con el plan ESCAPARATE, al
llegar a doce productos publicados el alta se bloquea con el aviso de subida de
plan, y los módulos fuera del plan aparecen atenuados en el panel con el plan
que los habilita.

## Sistema de diseño

Especificado en [`DESIGN.md`](DESIGN.md) y verificado con `npx @google/design.md
lint DESIGN.md` (cero errores, cero advertencias).

Lenguaje visual: blanco cálido, negro casi puro y un rojo profundo como único
acento. **Jost** en encabezados mayúsculas con tracking negativo y **Lato** en
cuerpo, navegación y botones; ambas auto-alojadas en `public/fonts` (subset
latino, sin llamadas a Google Fonts). Botones y campos tipo píldora de 30 px,
tarjetas de 14 px, etiquetas de 3 px, separación por líneas de 1 px y ninguna
sombra salvo el panel del carrito.

Movimiento: una sola curva (`cubic-bezier(.19, 1, .22, 1)`), revelados de 1,1 s
al entrar en pantalla, zoom de 1,06 en las fotos al pasar el cursor, banda
deslizante de marca y transiciones de 0,3 s en los controles. Todo se apaga con
`prefers-reduced-motion` y, sin JavaScript, el contenido queda visible.

El sistema corrige los problemas medidos en la tienda de referencia: cuerpo de
15 px en lugar de 13,3 px, contraste mínimo AA verificado, texto alternativo
obligatorio en cada imagen (el editor de producto no guarda sin él), encabezados
reales, sin carrusel automático e imágenes recomprimidas por debajo de 300 KB.

## Pruebas

`tests/e2e/run.py` recorre la demo por fase (67 comprobaciones):

| Fase | Qué verifica |
| --- | --- |
| 2 | Siembra, conteos reales, reinicio de la demo |
| 3 | Bloqueo por plan, reacción al cambio de plan, URL del plan |
| 4 | Portada, grilla, ficha, carrito, checkout, seguimiento, 404 |
| 5 | Catálogo, alta y persistencia de producto, ajuste de stock y movimiento |
| 6 | Pedidos, cambio de estado, notas, comprobante, devolución |
| 7 | Badge DEMO, galería con zoom y lightbox, filtros de colección, login por rol y editor de tema con contraste |
| QA | Contraste AA, sin scroll horizontal en 1440 y 390, sin errores de consola |

## Despliegue

Cada push a `main` compila y publica mediante `.github/workflows/deploy.yml`. El
dominio propio se declara en `public/CNAME` y resuelve por un CNAME de Cloudflare
hacia GitHub Pages.

## Créditos

Las fotografías de la demo provienen de Wikimedia Commons con licencia libre;
autor, licencia y enlace de origen están en `public/img/ATTRIBUTION.md`. El
catálogo de Tienda Express replica nombres y precios reales del comercio.

## Licencia

Propietario. Ver [LICENSE](LICENSE). El código se publica para revisión y para
servir la demo; no se concede permiso de reutilización.
