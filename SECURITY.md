# Política de seguridad

## Versiones soportadas

El repositorio publica un único sitio estático desde la rama `main`. Solo la
última versión desplegada recibe correcciones.

| Rama | Soporte |
| --- | --- |
| `main` | Sí |

## Cómo reportar una vulnerabilidad

Escribe a **security@stuko.dev** con:

- descripción del problema y su impacto,
- pasos para reproducirlo (URL, navegador, payload),
- evidencia (captura, respuesta HTTP, fragmento de consola).

No abras un issue público para una vulnerabilidad sin corregir. Confirmamos
recepción en 72 horas hábiles y publicamos la corrección antes de cualquier
detalle técnico.

## Alcance

En alcance: XSS, inyección en contenido renderizado, fugas de datos del
navegador, dependencias vulnerables, configuración incorrecta de CSP o de
permisos de GitHub Actions.

Fuera de alcance: denegación de servicio voluntaria, ingeniería social,
reportes generados automáticamente sin prueba de explotación, y cualquier
hallazgo que dependa de un navegador sin soporte.

## Controles aplicados

- **Sin secretos en el repositorio.** Toda credencial va por variables de
  entorno de GitHub Actions; `.env` está ignorado. El sitio compilado no
  contiene claves.
- **Acciones fijadas por SHA de commit** en `.github/workflows/deploy.yml`, con
  permisos mínimos por job (`contents: read` en el build) y
  `persist-credentials: false` en el checkout.
- **Dependabot** activo para npm y GitHub Actions, con PRs semanales.
- **Cabeceras de seguridad en el borde.** Una regla de transformación de
  Cloudflare acotada a `store.stuko.dev` añade `Strict-Transport-Security`
  (1 año, con subdominios), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
  `Permissions-Policy` y la `Content-Security-Policy`. La CSP se envía también
  como `meta` en cada documento: la cabecera manda y el `meta` queda como
  defensa en profundidad si la regla de borde se retira.
- **Clickjacking:** `frame-ancestors 'none'` en la cabecera, verificado
  intentando enmarcar el sitio (el navegador bloquea la carga).
- **Protección de rama** en `main`: force push y borrado bloqueados, historial
  lineal obligatorio, y las alertas de vulnerabilidades de Dependabot activadas.
- **Sin formularios ni backend** en esta fase: no se recolectan datos
  personales, no hay cookies de terceros ni analítica embebida.

## Limitaciones conocidas

GitHub Pages no permite enviar cabeceras HTTP propias. Por eso la CSP viaja como
`<meta http-equiv>` y necesita `'unsafe-inline'` para el bootstrap de hidratación
de Astro. Cuando el sitio pase a un origen con control de cabeceras (Cloudflare o
k3s), la política se mueve a cabecera real y se elimina `'unsafe-inline'`
mediante hashes de los scripts en línea.

El dominio está detrás de Cloudflare y la zona tiene Web Analytics activado: el
borde inyecta un beacon de `static.cloudflareinsights.com` en cada respuesta. La
CSP del sitio lo bloquea, así que la consola del navegador muestra ese bloqueo.
Es el comportamiento buscado —ningún script de terceros corre en la demo—; el
aviso desaparece si se desactiva Web Analytics para la zona desde el panel de
Cloudflare.
