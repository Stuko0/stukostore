---
version: alpha
name: StukoStore
description: Catálogo boliviano con calidez editorial — blanco cálido, acento rojo profundo, rótulos en mayúsculas y revelados suaves.
colors:
  primary: "#b21820"
  primary-hover: "#8f1319"
  secondary: "#0b0b0b"
  tertiary: "#e9e5e5"
  neutral: "#ffffff"
  cream: "#fff7f2"
  ink: "#0b0b0b"
  ink-soft: "#3e3e3e"
  muted: "#6b6b6b"
  success: "#56ad6a"
  error: "#d02e2e"
  warn: "#ecbd5e"
  sale: "#b21820"
typography:
  h1:
    fontFamily: Jost
    fontSize: 3rem
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  h2:
    fontFamily: Jost
    fontSize: 2.25rem
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.005em"
  h3:
    fontFamily: Jost
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.25
  label:
    fontFamily: Lato
    fontSize: 0.6875rem
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.075em"
  body-md:
    fontFamily: Lato
    fontSize: 0.95rem
    fontWeight: 400
    lineHeight: 1.6
  body-lg:
    fontFamily: Lato
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.55
rounded:
  sm: 3px
  md: 14px
  lg: 22px
  pill: 30px
spacing:
  sm: 8px
  md: 24px
  lg: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: label
    rounded: "{rounded.pill}"
    padding: 14px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.pill}"
  button-ghost:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    typography: label
    rounded: "{rounded.pill}"
    padding: 14px
  button-ghost-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 16px
  badge:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    typography: label
    rounded: "{rounded.sm}"
    padding: 6px
  input:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px
  price-sale:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.sale}"
    typography: body-md
  band-cream:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  surface-secondary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  text-muted:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.muted}"
    typography: body-md
  text-ink-soft:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.ink-soft}"
    typography: body-md
  notice-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px
  notice-warn:
    backgroundColor: "{colors.warn}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px
  notice-error:
    backgroundColor: "{colors.error}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: 12px
---

## Overview

Blanco cálido como lienzo, negro casi puro como tinta y un rojo profundo como
único acento. El sistema es editorial y luminoso: encabezados en Jost
mayúsculas con tracking negativo, cuerpo y rótulos en Lato mayúsculas con
tracking amplio, botones tipo píldora de 30 px, tarjetas de radio 14 px y
separación por líneas de 1 px en lugar de sombras. El movimiento es la firma:
revelados de 1,1 s con curva exponencial, imágenes que descubren su contenido y
tarjetas que cambian de foto al pasar el cursor.

Referencia medida: `mhw3bomber.com` (tema Shopify). Los valores de esta
especificación provienen de sus variables CSS reales —`--COLOR-ACCENT #fff7f2`,
`--COLOR-SALE-BG #b21820`, `--COLOR-BG-SECONDARY #e9e5e5`, `--COLOR-BORDER
#d3d3d3`, `--RADIUS 30px`, `--RADIUS-SMALL 22px`, `--FONT-STACK-BODY Lato`,
`--FONT-STACK-HEADING Jost`, `--LETTER-SPACING-BUTTON 0.075em`— y de sus
transiciones (`transform 1.1s cubic-bezier(.19,1,.22,1)`) y animaciones
(`fadeInUp`, `clipPathFromLeft`, `heroFade`, `cartDrawerItemsFadeInUp`).

## Colors

- **Primary (#b21820):** rojo profundo. Único color de marca: precio rebajado,
  etiqueta de oferta, acción principal en secciones oscuras. No se usa para
  texto corrido ni para bordes decorativos.
- **Secondary (#0b0b0b):** negro casi puro. Tinta de todo el texto, fondo de la
  barra de marca, relleno de botones fantasma en hover.
- **Tertiary (#e9e5e5):** gris cálido. Fondos secundarios, filas alternas,
  estado deshabilitado.
- **Neutral (#ffffff):** blanco del lienzo y de las tarjetas.
- **Cream (#fff7f2):** blanco cálido de acento, reservado para bandas
  destacadas y avisos de plan.
- **Ink-soft (#3e3e3e)** y **Muted (#6b6b6b):** texto secundario y metadatos.
  Ambos sostienen 4,5:1 sobre blanco y sobre gris cálido.
- **Border (#d3d3d3)** y **Border-hairline (#f0ecec):** estructura. Toda la
  separación del sistema es una línea de 1 px.
- **Error (#d02e2e)** y **Warn (#ecbd5e):** solo estados de formulario y avisos.

## Typography

Dos familias, ambas auto-alojadas (subset latin, sin llamadas a Google Fonts):

- **Jost** en encabezados, siempre mayúsculas, peso 600. Titulares grandes con
  tracking negativo (-0,01em) que dan el aire editorial.
- **Lato** en cuerpo, navegación, botones y rótulos. El cuerpo va en 15,2 px
  (0,95rem) con interlineado 1,6.

Escala: rótulo 11 px / cuerpo 15,2 px / cuerpo grande 18 px / h3 24 px /
h2 36 px / h1 48 px en escritorio, con `clamp()` para bajar en móvil. Los
rótulos y botones van en mayúsculas con tracking de 0,05em a 0,1em.

## Layout

Ancho máximo 1440 px, ancho de lectura 840 px. Ritmo vertical por bandas: 64 px
en escritorio, 51 px en móvil. Grilla de productos de 4 columnas con separación
de 16 px; 2 columnas en tablet y 1 en móvil. El encabezado es fijo con barra de
anuncios arriba y se vuelve translúcido sobre la portada.

## Elevation & Depth

Sin sombras. La jerarquía se construye con líneas de 1 px, con cambios de fondo
entre blanco y gris cálido, y con el zoom suave de las imágenes al pasar el
cursor (1,06 en 1,1 s). Un único uso de sombra está permitido: el panel del
carrito desplegable.

## Shapes

Radios: 3 px para etiquetas y monogramas, 14 px para tarjetas e imágenes, 22 px
para bloques grandes, 30 px para botones y campos (píldora), 50 % para
indicadores y avatares. La mezcla de píldora en controles y 14 px en superficies
es deliberada: los controles se ven suaves, las superficies siguen siendo
rectangulares.

## Components

- **button-primary:** píldora roja, rótulo en mayúsculas, 14 px de relleno. Hover a
  `button-primary-hover` en 0,3 s.
- **button-ghost:** píldora blanca con borde de 1 px; en hover invierte a negro
  pleno.
- **card:** superficie blanca de radio 14 px sobre gris cálido, con la foto en la
  mitad superior. En hover la imagen escala a 1,06 y aparece la segunda foto.
- **badge:** etiqueta negra de 3 px de radio para "Nuevo", "Oferta" y el plan.
- **input:** campo blanco de radio píldora con borde gris; el foco lo lleva a
  negro sin sombra.

## Do's and Don'ts

### Do
- Usar el rojo solo como acento: precio rebajado, etiqueta de oferta y acción
  principal sobre fondo oscuro.
- Mantener los encabezados en mayúsculas con Jost 600 y tracking negativo.
- Reservar el movimiento para revelados de entrada y hover; una sola curva,
  `cubic-bezier(.19,1,.22,1)`.
- Mantener cada texto por encima de 4,5:1 de contraste y verificar cada cambio
  de color con una medición, no a ojo.
- Usar `prefers-reduced-motion` para apagar revelados y zooms.

### Don't
- No introducir una tercera familia tipográfica ni cursivas.
- No usar sombras para separar secciones: van líneas de 1 px.
- No poner texto blanco sobre el blanco cálido ni sobre gris claro.
- No animar propiedades de layout (ancho, alto, posición): solo `transform` y
  `opacity`.
- No copiar componentes, textos ni imágenes del sitio de referencia: se replica
  el lenguaje visual, no el contenido.
