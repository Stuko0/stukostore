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
- **Content Security Policy** emitida como meta tag en cada documento
  (`default-src 'self'`, `object-src 'none'`, `base-uri 'none'`,
  `form-action 'self'`). `frame-ancestors` no se declara en el meta porque los
  navegadores lo ignoran ahí; la protección contra clickjacking se aplica como
  cabecera cuando el sitio tenga control de cabeceras.
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
