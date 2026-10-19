#!/usr/bin/env python3
"""Genera las semillas de la demo de StukoStore.

Los datos de Tienda Express son los reales del catálogo auditado (nombres y
precios en bolivianos). Los otros dos comercios son inventados para mostrar que
la plataforma es multi-tienda. Las imágenes provienen de Wikimedia Commons
(ver public/img/ATTRIBUTION.md).

Uso: python3 scripts/build_seeds.py
"""
import json
import pathlib

OUT = pathlib.Path("src/data/seed")
OUT.mkdir(parents=True, exist_ok=True)


def write(name: str, data) -> None:
    path = OUT / name
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{name:<20} {path.stat().st_size // 1024:>4} KB")


def stamp(day: int, month: int = 9) -> str:
    return f"2026-{month:02d}-{day:02d}T10:00:00-04:00"


# ---------------------------------------------------------------- colecciones

COLLECTIONS = [
    ("te-c-outdoor", "te", "outdoor", "Outdoor",
     "Botellas y tazas térmicas para el día a día", False),
    ("te-c-cafe", "te", "accesorios-de-cafe", "Accesorios de café",
     "Métodos de preparación manual", False),
    ("te-c-salud", "te", "salud-y-bienestar", "Salud y bienestar",
     "Hidratación y rutinas saludables", False),
    ("co-c-origen", "co", "cafes-de-origen", "Cafés de origen",
     "Microlotes de Yungas y Caranavi", False),
    ("co-c-metodos", "co", "metodos", "Métodos",
     "Prensa, goteo y cafetera de vidrio", False),
    ("co-c-accesorios", "co", "accesorios", "Accesorios",
     "Tazas, hervidores y molinos", False),
    ("mo-c-mochilas", "mo", "mochilas", "Mochilas",
     "Mochilas y bolsos de trekking", False),
    ("mo-c-campamento", "mo", "campamento", "Campamento",
     "Carpa, saco de dormir e iluminación", False),
    ("mo-c-hidratacion", "mo", "hidratacion", "Hidratación",
     "Botellas, termos y cantimploras", False),
]

# ------------------------------------------------------------------- productos
# (id, tenant, slug, título, descripción, colecciones, tags, opciones,
#  variantes [(sku, opciones, precio, precio comparativo, costo)], imagen, alt,
#  estado)

P = [
    ("te-p1", "te", "botella-bubba-trailblazer-straw-licorice-40oz",
     "Botella Bubba Trailblazer Straw Licorice 40oz",
     "Botella térmica de 1,2 litros con sorbete y asa; mantiene el frío hasta 24 horas.",
     ["te-c-outdoor", "te-c-salud"], ["botellas", "termos", "outdoor"],
     [("Color", ["Licorice", "Blue Corn"])],
     [("BUBBA-40-LIC", {"Color": "Licorice"}, 349, 399, 215),
      ("BUBBA-40-BLC", {"Color": "Blue Corn"}, 349, 399, 215)],
     "termo-40oz", "Botellas térmicas de acero inoxidable alineadas sobre una mesa", "activo"),

    ("te-p2", "te", "botella-contigo-autospout-fit-straw-32oz",
     "Botella Contigo Autospout Fit Straw 32oz",
     "Botella de 946 ml con boquilla automática y sorbete integrado.",
     ["te-c-outdoor"], ["botellas", "termos"],
     [("Color", ["Licorice"])],
     [("CONTIGO-32-LIC", {"Color": "Licorice"}, 399, None, 250)],
     "termo-32oz", "Botella de acero inoxidable con tapa y pico bebible", "activo"),

    ("te-p3", "te", "taza-contigo-streeterville-mug-14oz",
     "Taza Contigo Streeterville Mug 14oz Stainless Steel",
     "Taza térmica de 414 ml con tapa de rosca, apta para café de oficina.",
     ["te-c-outdoor", "te-c-salud"], ["tazas", "termos"],
     [("Color", ["Licorice"])],
     [("MUG-14-LIC", {"Color": "Licorice"}, 299, None, 190)],
     "taza-14oz", "Taza de cerámica esmaltada sobre superficie clara", "activo"),

    ("te-p4", "te", "botella-contigo-snapseal-huron-20-16oz",
     "Botella Contigo Snapseal Huron 2.0 16oz 473 ml Blue Corn",
     "Botella de 473 ml con tapa a presión; cierre a prueba de derrames.",
     ["te-c-outdoor"], ["botellas"],
     [("Color", ["Blue Corn"])],
     [("SNAP-16-BLC", {"Color": "Blue Corn"}, 249, None, 150)],
     "termo-16oz", "Botella de acero inoxidable con tapa azul sobre una mesa", "activo"),

    ("te-p5", "te", "molino-11-clicks-acero-inoxidable",
     "Molino 11 Clicks Cuerpo de Acero Inoxidable",
     "Molino manual con regulación de 11 clics y cuerpo de acero inoxidable.",
     ["te-c-cafe"], ["cafe", "molinos"],
     [],
     [("MOL-11-AC", {}, 449, None, 280)],
     "molino-cafe", "Molino manual de café con manivela", "activo"),

    ("te-p6", "te", "origami-porcelana-m-base-madera",
     'Origami de Porcelana "M" Base de Madera',
     "Dripper de porcelana con 20 estrías y base de madera.",
     ["te-c-cafe"], ["cafe", "drippers"],
     [],
     [("ORIG-M-MAD", {}, 199, None, 120)],
     "dripper-porcelana", "Dripper de porcelana blanca sobre base de madera", "activo"),

    ("te-p7", "te", "tetera-cuello-de-cisne-15-lts",
     "Tetera Cuello de Cisne 1,5 Lts",
     "Hervidor de cuello de cisne para vertido controlado.",
     ["te-c-cafe"], ["cafe", "hervidores"],
     [],
     [("TET-CISNE-15", {}, 249, None, 160)],
     "tetera-cisne", "Hervidor de cuello largo sobre una hornilla", "activo"),

    ("te-p8", "te", "v60-diamond-vidrio-500ml",
     "V60 Diamond Juego Completo de Vidrio 500ml",
     "Dripper de vidrio con base y jarra de 500 ml; incluye filtros.",
     ["te-c-cafe"], ["cafe", "drippers"],
     [],
     [("V60-DIA-500", {}, 399, None, 240)],
     "chemex", "Jarra y filtro de vidrio para café por goteo", "activo"),

    ("co-p1", "co", "cafe-altura-caranavi-250g",
     "Café de Altura Caranavi 250 g",
     "Microlote lavado de Caranavi, tueste medio, notas a panela y naranja.",
     ["co-c-origen"], ["cafe", "microlote"],
     [("Molido", ["Grano", "Molido"])],
     [("CAR-250-GRA", {"Molido": "Grano"}, 65, None, 38),
      ("CAR-250-MOL", {"Molido": "Molido"}, 65, None, 38)],
     "cafe-grano", "Granos de café tostado en primer plano", "activo"),

    ("co-p2", "co", "cafe-molido-tarqui-250g",
     "Café Molido Tarqui 250 g",
     "Mezcla de la zona de Tarqui con tueste oscuro para prensa y cafetera.",
     ["co-c-origen"], ["cafe"],
     [],
     [("TAR-250", {}, 58, None, 34)],
     "cafe-molido", "Café molido sobre una superficie oscura", "activo"),

    ("co-p3", "co", "prensa-francesa-600ml",
     "Prensa Francesa 600 ml",
     "Prensa de vidrio templado con filtro de acero de cuatro piezas.",
     ["co-c-metodos"], ["cafe", "prensas"],
     [],
     [("PRE-600", {}, 190, 220, 110)],
     "prensa-francesa", "Prensa francesa de vidrio con café preparado", "activo"),

    ("co-p4", "co", "cafetera-vidrio-6-tazas",
     "Cafetera de Vidrio 6 Tazas",
     "Jarra de vidrio borosilicato para goteo manual, 800 ml.",
     ["co-c-metodos"], ["cafe"],
     [],
     [("CAF-6T", {}, 380, None, 230)],
     "chemex", "Jarra de vidrio con filtro cónico y café", "activo"),

    ("co-p5", "co", "molino-manual-cafe",
     "Molino Manual de Café",
     "Molino de muelas cónicas con 18 pasos de molienda.",
     ["co-c-metodos", "co-c-accesorios"], ["cafe", "molinos"],
     [],
     [("MOL-MAN", {}, 320, 360, 190)],
     "molino-cafe", "Molino de café con manivela y depósito de madera", "activo"),

    ("co-p6", "co", "taza-ceramica-250ml",
     "Taza de Cerámica 250 ml",
     "Taza de gres esmaltado, apta para microondas y lavavajillas.",
     ["co-c-accesorios"], ["tazas"],
     [],
     [("TAZ-250", {}, 70, None, 32)],
     "taza-14oz", "Taza de cerámica clara vista desde arriba", "activo"),

    ("co-p7", "co", "dripper-ceramico-02",
     "Dripper Cerámico 02",
     "Dripper de gres para filtros cónicos tamaño 02.",
     ["co-c-metodos"], ["cafe", "drippers"],
     [],
     [("DRIP-02", {}, 150, None, 80)],
     "dripper-porcelana", "Dripper de cerámica blanca con filtro de papel", "activo"),

    ("co-p8", "co", "hervidor-1l",
     "Hervidor 1 L",
     "Hervidor de acero con base plana para inducción.",
     ["co-c-accesorios"], ["hervidores"],
     [],
     [("HERV-1L", {}, 230, None, 140)],
     "tetera-cisne", "Hervidor metálico sobre una superficie de madera", "activo"),

    ("mo-p1", "mo", "mochila-trekking-45l",
     "Mochila de Trekking 45 L",
     "Mochila de 45 litros con espaldar ventilado y cubre lluvia incluido.",
     ["mo-c-mochilas"], ["mochilas", "trekking"],
     [("Talla", ["M", "L"])],
     [("MOCH-45-M", {"Talla": "M"}, 480, None, 300),
      ("MOCH-45-L", {"Talla": "L"}, 480, None, 300)],
     "mochila-outdoor", "Mochila de excursionista apoyada en una roca", "activo"),

    ("mo-p2", "mo", "botella-plegable-750ml",
     "Botella Plegable 750 ml",
     "Botella de silicona plegable, libre de BPA, para viaje.",
     ["mo-c-hidratacion"], ["botellas"],
     [],
     [("PLEG-750", {}, 85, None, 42)],
     "botella-outdoor", "Botella de agua junto a equipo de senderismo", "activo"),

    ("mo-p3", "mo", "linterna-frontal-400lm",
     "Linterna Frontal 400 lúmenes",
     "Linterna recargable con tres modos y sensor de movimiento.",
     ["mo-c-campamento"], ["iluminacion"],
     [],
     [("LINF-400", {}, 220, None, 130)],
     "linterna", "Linterna frontal encendida en la oscuridad", "activo"),

    ("mo-p4", "mo", "saco-dormir-menos5",
     "Saco de Dormir -5 °C",
     "Saco de dormir de fibra hueca para clima frío, con capucha ajustable.",
     ["mo-c-campamento"], ["dormir"],
     [],
     [("SACO-M5", {}, 550, None, 340),],
     "saco-dormir", "Saco de dormir extendido sobre el pasto", "activo"),

    ("mo-p5", "mo", "carpa-2-personas",
     "Carpa 2 Personas",
     "Carpa de doble techo con armazón de aluminio y funda de transporte.",
     ["mo-c-campamento"], ["carpas"],
     [],
     [("CARPA-2P", {}, 890, 990, 560)],
     "carpa", "Carpa de dos personas armada en el campo", "activo"),

    ("mo-p6", "mo", "cantimplora-aluminio-1l",
     "Cantimplora de Aluminio 1 L",
     "Cantimplora liviana con tapa de rosca y mosquetón.",
     ["mo-c-hidratacion"], ["cantimploras"],
     [],
     [("CANT-1L", {}, 95, None, 48)],
     "cantimplora", "Cantimplora metálica colgada de una rama", "activo"),

    ("mo-p7", "mo", "termo-acero-1l",
     "Termo de Acero 1 L",
     "Termo de doble pared con pico vertedor y asa plegable.",
     ["mo-c-hidratacion"], ["termos"],
     [],
     [("TERM-1L", {}, 210, None, 120)],
     "termo-32oz", "Termo de acero inoxidable sobre una superficie de piedra", "activo"),

    ("mo-p8", "mo", "botella-termica-500ml",
     "Botella Térmica 500 ml",
     "Botella de acero cepillado que mantiene la temperatura seis horas.",
     ["mo-c-hidratacion"], ["botellas"],
     [],
     [("BOT-500", {}, 165, None, 90)],
     "termo-16oz", "Botella térmica de acero con tapa negra", "activo"),
]

# ------------------------------------------------------------------- locales

LOCATIONS = [
    ("te-l1", "te", "Cochabamba Centro", "Cochabamba", "Av. Heroínas 456", True),
    ("te-l2", "te", "Quillacollo", "Quillacollo", "Av. Blanco Galindo km 12", True),
    ("te-l3", "te", "Almacén central", "Cochabamba", "Parque Industrial, galpón 7", False),
    ("co-l1", "co", "La Paz Sopocachi", "La Paz", "Av. 6 de Agosto 2170", True),
    ("co-l2", "co", "Tostaduría", "La Paz", "Calle Murillo 1102", False),
    ("mo-l1", "mo", "Santa Cruz Equipetrol", "Santa Cruz", "Av. San Martín 180", True),
    ("mo-l2", "mo", "Depósito Norte", "Santa Cruz", "Av. Cristo Redentor km 6", False),
]

# ------------------------------------------------------------------ clientes

CUSTOMERS = [
    ("te-cu1", "te", "Mariana Quiroga", "59171234501", "mariana.quiroga@correo.bo",
     "Cochabamba", ["recurrente"], "Prefiere entrega en la mañana."),
    ("te-cu2", "te", "Jorge Terrazas", "59171234502", "jorge.terrazas@correo.bo",
     "Quillacollo", ["nuevo"], ""),
    ("te-cu3", "te", "Sinclair Ltda.", "59171234503", "compras@sinclair.bo",
     "Cochabamba", ["mayorista"], "Compra por volumen para regalos de empresa."),
    ("co-cu1", "co", "Ana Belén Ríos", "59171234504", "ana.rios@correo.bo",
     "La Paz", ["recurrente"], "Toma el café en grano."),
    ("co-cu2", "co", "Cafetería El Mirador", "59171234505", "hola@elmirador.bo",
     "La Paz", ["mayorista", "recurrente"], "Pide 10 kg por mes."),
    ("mo-cu1", "mo", "Diego Salvatierra", "59171234506", "diego.salva@correo.bo",
     "Santa Cruz", ["nuevo"], ""),
]

# ------------------------------------------------------------------ descuentos

DISCOUNTS = [
    ("te-d1", "te", "BIENVENIDA10", "porcentaje", 10, 200, True, 12, None),
    ("te-d2", "te", "ENVIOGRATIS", "envio", 0, 299, True, 31, None),
    ("co-d1", "co", "CAFE5", "porcentaje", 5, 100, True, 8, None),
    ("co-d2", "co", "DOCENA20", "monto", 120, 600, True, 3, None),
    ("mo-d1", "mo", "CAMPAMENTO15", "porcentaje", 15, 500, True, 5, None),
    ("mo-d2", "mo", "MOCHILA50", "monto", 50, 400, False, 0, None),
]

# -------------------------------------------------------------------- zonas

ZONES = [
    ("te-z1", "te", "Cochabamba ciudad", ["Cochabamba", "Quillacollo", "Tiquipaya"], 20, 299),
    ("te-z2", "te", "Interior del país", ["La Paz", "Santa Cruz", "Oruro", "Potosí", "Sucre"], 45, 499),
    ("co-z1", "co", "La Paz ciudad", ["La Paz", "El Alto"], 15, 250),
    ("co-z2", "co", "Resto de Bolivia", ["Cochabamba", "Santa Cruz", "Sucre"], 40, 450),
    ("mo-z1", "mo", "Santa Cruz ciudad", ["Santa Cruz", "Warnes"], 25, 400),
    ("mo-z2", "mo", "Resto de Bolivia", ["Cochabamba", "La Paz", "Sucre"], 50, 700),
]

# ------------------------------------------------------------ automatizaciones

AUTOMATIONS = [
    ("te-a1", "te", "Aviso de stock bajo",
     "stock_bajo", "qty <= umbral", "notificar_equipo",
     "Stock bajo: {{producto}} ({{sku}}) quedan {{qty}} unidades.", True),
    ("te-a2", "te", "Confirmación de pedido",
     "pedido_creado", "siempre", "avisar_cliente",
     "Hola {{cliente}}, recibimos tu pedido {{pedido}} por {{total}}. Te avisamos cuando salga.", True),
    ("te-a3", "te", "Carrito abandonado",
     "carrito_abandonado", "2 horas sin completar", "avisar_cliente",
     "{{cliente}}, dejaste {{producto}} en tu carrito. ¿Seguimos con el pedido?", False),
    ("co-a1", "co", "Reposición de microlote",
     "stock_bajo", "qty <= 5", "notificar_equipo",
     "Reponer {{producto}}: quedan {{qty}} bolsas.", True),
    ("co-a2", "co", "Clientes mayoristas",
     "cliente_nuevo", "etiqueta=mayorista", "etiquetar_cliente",
     "Enviar lista de precios por volumen a {{cliente}}.", True),
    ("mo-a1", "mo", "Pedido entregado",
     "pedido_entregado", "siempre", "avisar_cliente",
     "{{cliente}}, tu pedido {{pedido}} fue entregado. ¡Buen viaje!", True),
    ("mo-a2", "mo", "Alerta de devolución",
     "devolucion_creada", "monto >= 300", "notificar_equipo",
     "Devolución de {{cliente}} por {{total}}: revisar estado del producto.", True),
    ("mo-a3", "mo", "Pago confirmado",
     "pago_confirmado", "siempre", "notificar_equipo",
     "Pago confirmado del pedido {{pedido}} de {{cliente}}.", False),
]

# ------------------------------------------------------------------- páginas

PAGES = [
    ("te-pg1", "te", "envios", "Envíos y entregas",
     "Entregamos en Cochabamba el mismo día si el pedido entra antes de las 14:00. "
     "Al interior del país sale por flota y llega en 2 a 4 días. El envío es gratis "
     "en Cochabamba desde Bs.- 299 y a nivel nacional desde Bs.- 499."),
    ("te-pg2", "te", "devoluciones", "Cambios y devoluciones",
     "Aceptamos cambios dentro de los 7 días posteriores a la entrega, con el producto "
     "sin uso y en su empaque original. Si el producto llega dañado, reponemos el envío "
     "sin costo."),
    ("te-pg3", "te", "preguntas-frecuentes", "Preguntas frecuentes",
     "¿Cómo pago? Por QR, transferencia, contra entrega o con tarjeta en el checkout. "
     "¿Emiten factura? Sí, con NIT al momento del pedido. ¿Hacen ventas por mayor? Sí, "
     "desde 12 unidades con precio especial."),
    ("te-pg4", "te", "sobre-nosotros", "Sobre nosotros",
     "Tienda Express nació en Cochabamba para acercar botellas térmicas y equipo de café "
     "a quien quiere dejar de comprar descartables."),
    ("co-pg1", "co", "envios", "Envíos",
     "En La Paz entregamos en el día. Al resto del país enviamos por flota asegurada."),
    ("co-pg2", "co", "devoluciones", "Devoluciones",
     "Si el café no es de tu agrado, cambiamos el lote dentro de los 5 días."),
    ("co-pg3", "co", "preguntas-frecuentes", "Preguntas frecuentes",
     "Tostamos cada semana. El molido se ajusta al método que uses."),
    ("mo-pg1", "mo", "envios", "Envíos",
     "Despachamos desde Santa Cruz y el envío nacional demora de 3 a 5 días."),
    ("mo-pg2", "mo", "devoluciones", "Devoluciones",
     "Los equipos tienen garantía de fábrica. Gestionamos el reclamo con el proveedor."),
    ("mo-pg3", "mo", "preguntas-frecuentes", "Preguntas frecuentes",
     "¿Alquilan equipos? Sí, carpas y sacos por temporada."),
]

# ------------------------------------------------------------- bloques del home

BLOCKS = [
    ("te-b1", "te", "hero", "Botellas que duran todo el día",
     "Térmicas de acero inoxidable, tazas y accesorios de café en Cochabamba.",
     None, "termo-40oz", "Botellas térmicas de acero alineadas", True),
    ("te-b2", "te", "grilla", "Nuestra sugerencia", "", "te-c-outdoor", None, "", True),
    ("te-b3", "te", "grilla", "Accesorios de café", "", "te-c-cafe", None, "", True),
    ("te-b4", "te", "texto", "Envío gratis en Cochabamba",
     "Sobre Bs.- 299 la entrega en la ciudad corre por nuestra cuenta. Al interior del país, sobre Bs.- 499.",
     None, None, "", True),
    ("co-b1", "co", "hero", "Café de altura, tostado cada semana",
     "Microlotes de Caranavi y los Yungas, molidos al método que uses.",
     None, "cafe-grano", "Granos de café tostado", True),
    ("co-b2", "co", "grilla", "Microlotes", "", "co-c-origen", None, "", True),
    ("co-b3", "co", "grilla", "Métodos de preparación", "", "co-c-metodos", None, "", True),
    ("mo-b1", "mo", "hero", "Equipo para salir y no volver tan rápido",
     "Mochilas, carpas y todo lo que hace falta para el fin de semana.",
     None, "carpa", "Carpa armada en el campo", True),
    ("mo-b2", "mo", "grilla", "Campamento", "", "mo-c-campamento", None, "", True),
    ("mo-b3", "mo", "grilla", "Hidratación", "", "mo-c-hidratacion", None, "", True),
]

# --------------------------------------------------------------------- pedidos
# (id, tenant, cliente, ciudad, zona, método de pago, método de envío, estado,
#  días atrás, líneas [(producto, índice de variante, cantidad)])

ORDERS = [
    ("te-o1", "te", "te-cu1", "Cochabamba", "Cochabamba", "qr", "local", "entregado", 12,
     [("te-p1", 0, 1), ("te-p5", 0, 1)]),
    ("te-o2", "te", "te-cu2", "Quillacollo", "Cochabamba", "contra-entrega", "local", "enviado", 5,
     [("te-p3", 0, 2)]),
    ("te-o3", "te", "te-cu3", "Cochabamba", "Cochabamba", "transferencia", "local", "preparando", 3,
     [("te-p2", 0, 12), ("te-p4", 0, 6)]),
    ("te-o4", "te", "te-cu1", "Cochabamba", "Cochabamba", "pasarela", "retiro", "pagado", 2,
     [("te-p8", 0, 1), ("te-p6", 0, 2)]),
    ("te-o5", "te", "te-cu2", "Quillacollo", "Cochabamba", "qr", "local", "pendiente", 1,
     [("te-p7", 0, 1)]),
    ("te-o6", "te", "te-cu3", "Cochabamba", "Cochabamba", "transferencia", "local", "devuelto", 9,
     [("te-p5", 0, 1)]),
    ("co-o1", "co", "co-cu1", "La Paz", "La Paz", "qr", "local", "entregado", 10,
     [("co-p1", 0, 2), ("co-p3", 0, 1)]),
    ("co-o2", "co", "co-cu2", "La Paz", "La Paz", "transferencia", "local", "preparando", 4,
     [("co-p1", 1, 20)]),
    ("co-o3", "co", "co-cu1", "La Paz", "La Paz", "pasarela", "retiro", "pagado", 1,
     [("co-p7", 0, 1), ("co-p2", 0, 1)]),
    ("co-o4", "co", "co-cu2", "Cochabamba", "Resto", "contra-entrega", "nacional", "enviado", 6,
     [("co-p4", 0, 1)]),
    ("mo-o1", "mo", "mo-cu1", "Santa Cruz", "Santa Cruz", "qr", "local", "entregado", 8,
     [("mo-p1", 1, 1), ("mo-p3", 0, 1)]),
    ("mo-o2", "mo", "mo-cu1", "Santa Cruz", "Santa Cruz", "pasarela", "local", "pendiente", 1,
     [("mo-p5", 0, 1)]),
    ("mo-o3", "mo", "mo-cu1", "Cochabamba", "Resto", "transferencia", "nacional", "pagado", 3,
     [("mo-p4", 0, 1), ("mo-p6", 0, 2)]),
]


def build_products():
    products = []
    for (pid, tenant, slug, title, desc, cols, tags, options, variants, image, alt, status) in P:
        ts = stamp(int(pid[-1]) + 1, 8)
        products.append({
            "id": pid,
            "tenantId": tenant,
            "slug": slug,
            "title": title,
            "description": desc,
            "status": status,
            "collectionIds": cols,
            "tags": tags,
            "options": [{"name": n, "values": v} for n, v in options],
            "variants": [
                {
                    "id": f"{pid}-v{i + 1}",
                    "sku": sku,
                    "options": opts,
                    "price": price,
                    "compareAt": compare,
                    "cost": cost,
                    "barcode": f"77{abs(hash(sku)) % 10**10:010d}",
                    "active": True,
                }
                for i, (sku, opts, price, compare, cost) in enumerate(variants)
            ],
            "images": [{"src": f"/img/{image}.jpg", "alt": alt}],
            "seo": {"title": f"{title} | {tenant.upper()}", "description": desc[:150]},
            "createdAt": ts,
            "updatedAt": stamp(int(pid[-1]) + 1, 10),
        })
    return products


def variant_price(products, product_id, index):
    prod = next(p for p in products if p["id"] == product_id)
    return prod["variants"][index]["price"], prod


def build_orders(products):
    orders = []
    for (oid, tenant, customer, city, zone, pay, ship, status, days_ago, lines) in ORDERS:
        items = []
        for product_id, index, qty in lines:
            price, prod = variant_price(products, product_id, index)
            variant = prod["variants"][index]
            items.append({
                "variantId": variant["id"],
                "productId": prod["id"],
                "title": prod["title"],
                "sku": variant["sku"],
                "options": variant["options"],
                "qty": qty,
                "price": price,
            })
        subtotal = sum(i["price"] * i["qty"] for i in items)
        discount = round(subtotal * 0.1, 2) if oid in {"te-o1", "co-o1"} else 0
        shipping = {"retiro": 0, "local": 20, "nacional": 45}.get(ship, 0)
        taxable = subtotal - discount
        tax = round(taxable * 0.13, 2)
        total = round(taxable + shipping, 2)
        cust = next(c for c in CUSTOMERS if c[0] == customer)
        created = f"2026-10-{19 - days_ago:02d}T09:30:00-04:00"
        events = [
            {"at": created, "actor": "sistema", "type": "creado",
             "message": f"Pedido creado desde {ship}"},
        ]
        if status in {"pagado", "preparando", "enviado", "entregado", "devuelto"}:
            events.append({"at": created, "actor": "equipo", "type": "pago",
                           "message": f"Pago confirmado ({pay})"})
        if status in {"enviado", "entregado", "devuelto"}:
            events.append({"at": created, "actor": "equipo", "type": "envio",
                           "message": "Pedido despachado"})
        if status == "entregado":
            events.append({"at": created, "actor": "equipo", "type": "entrega",
                           "message": "Entregado al cliente"})
        if status == "devuelto":
            events.append({"at": created, "actor": "equipo", "type": "devolucion",
                           "message": "Devuelto: producto con detalle en la tapa"})
        returns = []
        if status == "devuelto":
            returns.append({
                "id": f"{oid}-r1",
                "at": created,
                "items": [{"variantId": items[0]["variantId"], "qty": 1}],
                "reason": "Producto con detalle en la tapa",
                "refund": round(items[0]["price"], 2),
                "restocked": True,
            })
        orders.append({
            "id": oid,
            "tenantId": tenant,
            "code": f"{tenant.upper()}-{1000 + len(orders)}",
            "customerId": customer,
            "customer": {
                "name": cust[2],
                "phone": cust[3],
                "email": cust[4],
                "city": city,
                "address": {
                    "line1": "Calle Los Alcornoques 145" if city == "Cochabamba" else "Av. Busch 1200",
                    "city": city,
                    "zone": zone,
                    "reference": "Portón negro, timbre 2",
                },
            },
            "items": items,
            "subtotal": round(subtotal, 2),
            "discount": discount,
            "couponCode": "BIENVENIDA10" if discount else None,
            "shipping": shipping,
            "tax": tax,
            "total": total,
            "status": status,
            "paymentMethod": pay,
            "paymentProof": f"comprobante-{oid}.jpg" if pay in {"qr", "transferencia"} else None,
            "shippingMethod": ship,
            "internalNotes": ["Cliente mayorista, facturar con NIT."] if customer == "te-cu3" else [],
            "returns": returns,
            "events": events,
            "createdAt": created,
            "updatedAt": created,
        })
    return orders


def main() -> None:
    products = build_products()

    write("collections.json", [
        {"id": cid, "tenantId": t, "slug": slug, "title": title,
         "description": desc, "automatic": auto, "rule": None}
        for cid, t, slug, title, desc, auto in COLLECTIONS
    ])

    write("products.json", products)

    write("locations.json", [
        {"id": lid, "tenantId": t, "name": name, "city": city, "address": addr, "pickup": pickup}
        for lid, t, name, city, addr, pickup in LOCATIONS
    ])

    write("customers.json", [
        {"id": cid, "tenantId": t, "name": name, "phone": phone, "email": email,
         "city": city, "tags": tags, "notes": notes, "createdAt": stamp(1, 6)}
        for cid, t, name, phone, email, city, tags, notes in CUSTOMERS
    ])

    write("discounts.json", [
        {"id": did, "tenantId": t, "code": code, "type": typ, "value": value,
         "minSubtotal": minimum, "active": active, "used": used, "limit": limit}
        for did, t, code, typ, value, minimum, active, used, limit in DISCOUNTS
    ])

    write("zones.json", [
        {"id": zid, "tenantId": t, "name": name, "cities": cities,
         "rate": rate, "freeAbove": free}
        for zid, t, name, cities, rate, free in ZONES
    ])

    write("automations.json", [
        {"id": aid, "tenantId": t, "name": name, "trigger": trig, "condition": cond,
         "action": action, "template": template, "enabled": enabled,
         "runs": [{"at": stamp(4 + i), "result": "ejecutada", "detail": "Ejecución de prueba"}
                  for i in range(2 if enabled else 0)]}
        for aid, t, name, trig, cond, action, template, enabled in AUTOMATIONS
    ])

    write("pages.json", [
        {"id": pid, "tenantId": t, "slug": slug, "title": title, "body": body}
        for pid, t, slug, title, body in PAGES
    ])

    write("blocks.json", [
        {"id": bid, "tenantId": t, "type": typ, "title": title, "body": body,
         "collectionId": col, "image": f"/img/{img}.jpg" if img else None,
         "alt": alt, "visible": visible}
        for bid, t, typ, title, body, col, img, alt, visible in BLOCKS
    ])

    write("orders.json", build_orders(products))
    print("\nsemillas generadas")


if __name__ == "__main__":
    main()
