# Auditoría — store.stuko.dev

**Fecha:** 20 de octubre de 2026
**Alcance:** sitio público, panel de administración de las tres tiendas demo, repositorio y configuración de borde.
**Método:** sondas HTTP y TLS, revisión de cabeceras y DNS, API de Cloudflare y de GitHub en modo lectura, `npm audit`, búsqueda de secretos, batería Playwright de 50 comprobaciones, `axe-core` sobre 10 vistas, medición de targets/contraste/overflow en 17 vistas, y pruebas de casos borde (XSS, cupón inválido, checkout vacío, código de pedido inexistente).

---

## 1. Resumen ejecutivo

| Área | Estado | Nota |
| --- | --- | --- |
| Transporte (TLS, redirección) | Correcto | Let's Encrypt vía Cloudflare, HTTP→HTTPS 301, mínimo TLS 1.2 |
| Cabeceras de seguridad | **Deficiente** | Sin HSTS, sin `nosniff`, sin `Referrer-Policy`, sin `X-Frame-Options`; CSP solo por `meta` |
| Aplicación (XSS, datos, secretos) | Correcto | Sin secretos, sin cookies, sin llamadas externas, HTML escapado (probado) |
| Repositorio y dependencias | Correcto con matices | 0 vulnerabilidades, Dependabot activo; sin revisiones requeridas |
| Borde (Cloudflare) | Mejorable | WAF gestionado sin reglas desplegadas; SSL en `full` y no `strict` |
| Funcionalidad | Correcto | 50/50 pruebas e2e; 17 vistas 200; flujos completos |
| Accesibilidad | Correcto tras correcciones | 0 violaciones de axe en 10 vistas; objetivos táctiles ≥24 px |
| Rendimiento | Muy bueno | LCP 780 ms, CLS 0, 28 peticiones, 805 KB totales |
| SEO técnico | Correcto tras correcciones | Sitemap y robots propios; canonical y metadatos presentes |

**Hallazgos: 14. Corregidos durante la auditoría: 8. Pendientes que requieren tu decisión: 6.**

---

## 2. Hallazgos y estado

### Corregidos en esta auditoría

| # | Hallazgo | Severidad | Evidencia | Corrección |
| --- | --- | --- | --- | --- |
| 1 | Enlace de la marca en el panel apuntaba a `/admin/{tenant.slug}/` literal y devolvía 404 | **Alta** (funcional) | Rastreo de enlaces internos | Interpolación corregida en `Admin.astro` + prueba |
| 2 | Contenido fuera de regiones: barra de avisos y selector de plan sin landmark | Media (a11y) | `axe-core` regla `region`, 1–4 nodos por vista | `role="region"` + `aria-label` en ambos |
| 3 | Salto de jerarquía de encabezados en `/demo` y `/buscar` | Media (a11y) | `axe-core` regla `heading-order` | Tarjetas a `h2` y `h2` oculto en resultados |
| 4 | Objetivos táctiles por debajo de 24 px: enlaces de pie (17 px), migas (14 px), acciones del panel (17–24 px), botones ± (28×24) | Media (a11y, WCAG 2.5.8) | 1 a 55 elementos por vista | `min-height: 26px` y botones de 32×32 |
| 5 | Sin `sitemap.xml` (95 páginas) | Media (SEO) | `/sitemap.xml` → 404 | Integración `@astrojs/sitemap`, panel excluido |
| 6 | `robots.txt` del borde sin referencia al sitemap y sin bloquear `/admin/` | Baja (SEO) | Cloudflare inyectaba su robots de content signals | `robots.txt` propio con `Sitemap:` y `Disallow: /admin/` |
| 7 | Sin `/.well-known/security.txt` | Baja | 404 | Publicado con contacto y política |
| 8 | `img/attribution.json` (metadato interno) publicado en el sitio | Baja | 200 en el dominio | Movido fuera de `public/` |

### Pendientes (requieren decisión de infraestructura)

| # | Hallazgo | Severidad | Detalle y propuesta |
| --- | --- | --- | --- |
| 9 | Faltan cabeceras de seguridad en el borde | **Alta** | Hoy no hay HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` ni `Permissions-Policy`. GitHub Pages no permite cabeceras propias, pero Cloudflare sí: una **Transform Rule** (Modify Response Header) acotada a `host eq "store.stuko.dev"` puede añadirlas sin tocar el resto del dominio. |
| 10 | CSP entregada como `meta` y con `'unsafe-inline'` en `script-src` | **Alta** | La CSP actual mitiga pero no es equivalente a una cabecera: `frame-ancestors` no funciona en `meta` y `'unsafe-inline'` reduce la protección. Propuesta: mover la CSP a cabecera y sustituir `'unsafe-inline'` por hashes de los scripts en línea (Astro puede exportarlos). |
| 11 | WAF gestionado sin reglas y DDoS L7 sin entrada configurada | **Alta** | `GET /zones/{zona}/rulesets`: `http_request_firewall_managed` con 0 reglas y `ddos_l7` con 0 reglas. Es una configuración **de toda la zona**, no solo de esta tienda: desplegar el Cloudflare Managed Ruleset endurece también tus otros subdominios. |
| 12 | SSL en modo `full` en lugar de `strict` | Media | El origen (GitHub Pages) presenta certificado válido; `strict` evita aceptar un certificado inválido si el origen cambia. |
| 13 | Escaneo de secretos parcial y sin revisiones obligatorias | Media | `secret_scanning` y push protection están activos, pero `non_provider_patterns` y `validity_checks` están apagados. La rama `main` no exige revisión (aceptable si sos el único mantenedor; conviene activarlo cuando entre alguien más). |
| 14 | Dependencias con rangos `^` | Baja | `astro ^7.4.0`, `@astrojs/solid-js ^7.1.0`, `solid-js ^1.9.17`. Dependabot cubre el riesgo, pero fijar versión elimina la ventana entre publicación y actualización. |

---

## 3. Transporte e infraestructura

```
HTTP/2 200 · server: cloudflare
Certificado: CN=stuko.dev · Let's Encrypt · válido 14 sep → 13 dic 2026
http:// → 301 https://
Cloudflare: ssl=full · always_use_https=on · min_tls_version=1.2
            security_level=high · browser_check=on
```

- DNS: `store` → CNAME a `stuko0.github.io`, proxied. Sin registros comodín que puedan interceptar.
- **Cabeceras observadas:** `content-type`, `cache-control: max-age=600`, `access-control-allow-origin: *` (de GitHub Pages), `alt-svc: h3`. Nota: el ACAO abierto es inocuo aquí porque no hay API ni cookies, pero conviene saberlo.
- **Cabeceras ausentes:** `strict-transport-security`, `x-content-type-options`, `referrer-policy`, `x-frame-options`, `permissions-policy`.

## 4. Seguridad de la aplicación

- **Secretos:** búsqueda de patrones (`ghp_`, `sk-`, `Bearer`, `api_key=`) en el árbol: 0 resultados. El historial no contiene credenciales; el despliegue usa el token efímero de Actions.
- **Exposición de archivos:** `.git/HEAD`, `.env`, `.env.example`, `package.json`, `astro.config.mjs`, `src/*`, `/dist/`, `/_assets/` y los `.map` de los bundles devuelven 404. No hay source maps públicos.
- **XSS:** se creó un producto con `<img src=x onerror="window.__xss=1">XSS` en el título; el panel lo muestra escapado (`&lt;img`) y la bandera nunca se activa. Solid escapa por defecto y el editor no interpreta HTML.
- **Datos del visitante:** la demo guarda todo en IndexedDB/localStorage del navegador. El bundle **no contiene ninguna llamada `fetch`** ni URLs externas (solo el enlace a `stuko.dev` y el namespace SVG de W3C). El checkout recolecta nombre y teléfono pero nunca sale del navegador.
- **Cookies:** el sitio no emite ninguna (`set-cookie` ausente).
- **Terceros:** la CSP bloquea el beacon de Cloudflare Web Analytics que el borde inyecta; es el único intento de script externo y queda bloqueado (verificado en consola).
- **Repositorio:** rama `main` con force push y borrado bloqueados, historial lineal, un solo colaborador, Dependabot con 0 alertas, `secret_scanning` y push protection activos, acciones fijadas por SHA y `persist-credentials: false`.
- **Dependencias:** `npm audit` → 0 vulnerabilidades en 5 dependencias directas.

## 5. Funcionalidad

- **Rutas:** 17 vistas auditadas (público, storefront y panel) responden 200 con un `h1` único y sin errores de consola propios.
- **Enlaces internos:** el rastreo sobre todas las vistas encontró un único enlace roto (el del punto 1), ya corregido.
- **Flujos completos** (50 comprobaciones Playwright): siembra y reinicio de la demo, gating por plan en panel y storefront, catálogo con alta/edición/duplicado/archivado y persistencia, inventario con movimientos, pedido de punta a punta con cupón, IVA y envío, seguimiento por código, cambio de estado, notas, comprobante y devolución con reposición de stock.
- **Casos borde probados:** cupón inexistente muestra error y no aplica descuento; checkout vacío no crea pedido y oculta la acción; código de pedido inexistente informa sin romper; detalle de pedido sin `id` renderiza sin excepción; 404 personalizado con estado 404 correcto.

## 6. Vistas y accesibilidad

- **axe-core:** 0 violaciones en landing, precios, demo, tienda, producto, checkout, búsqueda, panel, productos e inventario (1440 px). Antes de las correcciones: `region` (1–4 nodos) y `heading-order` (2 vistas).
- **Contraste:** todas las vistas pasan AA en texto normal (el cálculo se ejecuta en la batería e2e).
- **Objetivos táctiles:** 0 elementos por debajo de 24×24 tras las correcciones (antes 1–55 por vista).
- **Responsive:** sin scroll horizontal en 390, 768 y 1440 px en las vistas auditadas; navegación del storefront desplazable en móvil con el carrito siempre visible.
- **Imágenes:** todas con `alt`; las miniaturas del panel usan `alt=""` a propósito (decorativas, el nombre está al lado).
- **Movimiento:** los revelados respetan `prefers-reduced-motion` y, sin JavaScript, todo el contenido queda visible.

## 7. Rendimiento

Medición sobre `/t/tienda-express/` en 1440×900, red sin limitar:

| Métrica | Valor |
| --- | --- |
| TTFB | 500 ms |
| First Contentful Paint | 780 ms |
| Largest Contentful Paint | 780 ms |
| Cumulative Layout Shift | 0 |
| Load | 988 ms |
| Peticiones | 28 |
| Peso | imágenes 672 KB · fuentes 97 KB · JS 31 KB · CSS 5 KB |

Todo el peso está en las fotos de producto (17 imágenes recomprimidas a ≤181 KB). No hay JS de terceros, ni fuentes externas, ni frameworks de UI más allá de Solid para las islas.

## 8. SEO técnico

- `title` y `description` únicos por vista; `canonical` absoluto; `lang="es-BO"`.
- Panel con `meta robots noindex` y excluido del sitemap.
- `sitemap-index.xml` + `sitemap-0.xml` publicados; `robots.txt` propio con la referencia.
- **Falta:** imagen Open Graph (hoy no hay `og:image`), `twitter:card` y `hreflang` (el sitio es monolingüe, no aplica todavía).

## 9. Cómo reproducir

```bash
# transporte y cabeceras
curl -sI https://store.stuko.dev/

# exposición de archivos y rutas sensibles
for p in /.git/HEAD /.env /package.json /_assets/ /sitemap-index.xml; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "https://store.stuko.dev$p"; done

# dependencias y secretos
npm audit
grep -rInE "(ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,})" --exclude-dir=node_modules .

# funcionalidad (50 comprobaciones)
python3 tests/e2e/run.py https://store.stuko.dev

# accesibilidad, objetivos táctiles, casos borde y performance
python3 /tmp/audit_pass2.py https://store.stuko.dev
```

---

**Conclusión:** el sitio está sano en aplicación, funcionalidad, accesibilidad y rendimiento; lo que queda abierto es infraestructura de borde —cabeceras de seguridad, WAF y modo SSL estricto—, que son decisiones sobre toda la zona de Cloudflare y no sobre este repositorio.
