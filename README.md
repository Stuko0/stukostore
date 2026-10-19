# StukoStore

Ecommerce por suscripción para tiendas bolivianas. Un catálogo deja de ser una
página de Google Sites con fotos sueltas y pasa a ser una tienda con inventario,
pedidos, pagos, equipo y automatizaciones.

Este repositorio contiene el sitio público del producto y la demo del selector
de planes. La demo se publica en GitHub Pages:
https://stuko0.github.io/stukostore/

## Estado

Fase 1 de 9 del plan de implementación. Lo que ya está en línea:

- Portada del producto con la identidad visual y la tipografía del sistema.
- Página de precios con los cuatro planes en bolivianos.
- Comparación completa de funciones con un selector de plan colapsable que
  reconfigura la vista en el mismo frame y persiste la elección en la URL
  (`?tier=comercio`) y en el navegador.

Lo que todavía no está: storefront por tienda, panel de administración, capa de
datos con cache local, checkout y la batería de pruebas de accesibilidad.

## Roadmap

| Fase | Entrega |
| --- | --- |
| 1 | Portada, precios y selector de planes (en línea) |
| 2 | Semillas de datos y cache local en IndexedDB |
| 3 | Motor de planes, límites y estados bloqueados |
| 4 | Storefront por tienda: catálogo, producto, carrito, checkout |
| 5 | Panel: productos, pedidos, tema, automatizaciones, equipo |
| 6 | Onboarding y página de facturación simulada |
| 7 | Pruebas Playwright de accesibilidad y persistencia |
| 8 | Dominio propio y cabeceras de seguridad reales |
| 9 | Migración de la capa de datos a Go + SQLite |

## Stack

| Pieza | Decisión |
| --- | --- |
| Framework | Astro 5, salida estática |
| Interactividad | Islas SolidJS (solo el selector de planes hidrata) |
| Estilos | CSS con custom properties, sin framework |
| Datos | Semillas JSON + IndexedDB (fase 2), sin backend todavía |
| Despliegue | GitHub Pages con GitHub Actions |
| Pruebas | Playwright, matriz por plan y por viewport (fase 7) |

Sin backend en esta entrega: la demo guarda el estado en el navegador. La capa
de datos se define tras una interfaz (`StoreAPI`) con dos implementaciones
intercambiables, para poder mover la demo a Go + SQLite sin tocar la interfaz.

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:4321/stukostore/
npm run build      # genera dist/
npm run preview    # sirve dist/ con el mismo base path
npm run check      # typecheck de Astro + TypeScript
```

El sitio se sirve bajo el subpath `/stukostore` (GitHub Pages de proyecto). Los
enlaces internos usan `import.meta.env.BASE_URL`; no escribir rutas absolutas a
mano.

## Estructura

```
src/
  components/TierDemo.tsx   Isla Solid: matriz de funciones + selector colapsable
  layouts/Base.astro        Documento, barra de marca, pie, política CSP
  lib/tiers.ts              Fuente única de precios, límites y gating
  pages/index.astro         Portada
  pages/precios.astro       Comparación completa
  styles/tokens.css         Tokens del sistema de diseño
  styles/global.css         Primitivas de layout y componentes
  styles/tier.css           Matriz y dock
```

La regla del proyecto es que **ningún componente inventa datos ni precios**:
todo se resuelve desde `src/lib/tiers.ts` o, en la fase 2, desde `StoreAPI`.

## Sistema de diseño

Monocromo, estructura por hairlines de 1px, radio 3px, cero sombras. La
fotografía de producto es la única fuente de color. Base tipográfica Helvetica
Neue con respaldo en la pila del sistema; etiquetas en mayúsculas con tracking
de +0.015em; wordmark a escala fluida hasta 148px.

Contraste mínimo 4.5:1 en texto normal y 3:1 en texto grande. El documento de
tokens vive en `src/styles/tokens.css` y se deriva del `DESIGN.md` del proyecto.

## Planes

| Plan | Precio | Para quién |
| --- | --- | --- |
| ESCAPARATE | Bs. 0 | Catálogo con pedido por WhatsApp |
| TIENDA | Bs. 119 / mes | Dominio propio, inventario, cupones, pago en línea |
| COMERCIO | Bs. 329 / mes | Equipo, sucursales, envíos, devoluciones, automatizaciones |
| DISTRIBUIDOR | Bs. 790 / mes | Multi-marca, API, webhooks, reportes, IA |

Referencia usada para el precio: 1 USD ≈ 11,8 Bs y sueldo mínimo nacional de
3.300 Bs. El plan más alto equivale al 24 % de un sueldo.

## Despliegue

Cada push a `main` compila y publica en GitHub Pages mediante
`.github/workflows/deploy.yml`. Las acciones están fijadas por SHA de commit, el
job de build corre con permisos de solo lectura y el token de checkout no se
persiste.

## Seguridad

Ver [SECURITY.md](SECURITY.md). No se aceptan credenciales, claves ni tokens en
el repositorio: la configuración sensible va por variables de entorno y nunca se
compila dentro del sitio.

## Licencia

Propietario. Ver [LICENSE](LICENSE). El código se publica para revisión y
despliegue de la demo; no se concede permiso de reutilización.
