// StukoStore — tier model.
// Single source of truth: prices, limits and feature gating all resolve here.
// Every gate in the UI (<TierGate>, limits, locked states) reads from this file.

export const TIERS = [
  {
    id: 'escaparate',
    name: 'ESCAPARATE',
    bob: 0,
    usd: 0,
    annualBob: 0,
    pitch: 'Tu catálogo ordenado y cobrable por WhatsApp. Deja de mandar fotos sueltas.',
    forWho: 'Tiendas que recién empiezan o venden solo por redes.',
  },
  {
    id: 'tienda',
    name: 'TIENDA',
    bob: 119,
    usd: 10,
    annualBob: 1190,
    pitch: 'Tienda completa con dominio propio, inventario, cupones y pagos en línea.',
    forWho: 'Comercios con local o marca que ya venden todos los días.',
  },
  {
    id: 'comercio',
    name: 'COMERCIO',
    bob: 329,
    usd: 28,
    annualBob: 3290,
    pitch: 'Operación real: equipo con roles, sucursales, envíos, devoluciones y automatizaciones.',
    forWho: 'Tiendas con empleados, más de una sucursal o volumen diario.',
  },
  {
    id: 'distribuidor',
    name: 'DISTRIBUIDOR',
    bob: 790,
    usd: 67,
    annualBob: 7900,
    pitch: 'Multi-marca, API, webhooks, reportes profundos e IA de catálogo.',
    forWho: 'Distribuidores, cadenas y marcas con catálogo grande o reventa.',
  },
] as const;

export type TierId = (typeof TIERS)[number]['id'];

const ORDER: TierId[] = TIERS.map((t) => t.id);

export const tierById = (id: TierId) => TIERS.find((t) => t.id === id)!;

export function rank(tier: TierId): number {
  return ORDER.indexOf(tier);
}

export function can(tier: TierId, feature: FeatureId): boolean {
  return rank(tier) >= rank(FEATURE_BY_ID[feature].min);
}

export function minTierFor(feature: FeatureId): TierId {
  return FEATURE_BY_ID[feature].min;
}

export function limitFor(tier: TierId, feature: FeatureId): number {
  const f = FEATURE_BY_ID[feature];
  if (!f.limit) return can(tier, feature) ? Infinity : 0;
  const entry = f.limit[tier];
  if (entry === undefined) return can(tier, feature) ? Infinity : 0;
  return entry;
}

export type FeatureGroup =
  | 'CATALOGO'
  | 'VENTAS'
  | 'GESTION'
  | 'PERSONALIZACION'
  | 'AUTOMATIZACION'
  | 'ESCALA';

interface Feature {
  id: FeatureId;
  label: string;
  group: FeatureGroup;
  min: TierId;
  limit?: Partial<Record<TierId, number>>;
  note?: string;
}

export const FEATURES = [
  // Catálogo
  { id: 'products', label: 'Productos publicados', group: 'CATALOGO', min: 'escaparate', limit: { escaparate: 12, tienda: 300 } },
  { id: 'variants', label: 'Variantes con SKU propio', group: 'CATALOGO', min: 'tienda', note: 'talla, color, capacidad' },
  { id: 'inventory', label: 'Inventario y stock por variante', group: 'CATALOGO', min: 'tienda' },
  { id: 'collections', label: 'Colecciones y categorías', group: 'CATALOGO', min: 'tienda', limit: { tienda: 20 } },
  { id: 'search', label: 'Buscador con filtros y orden', group: 'CATALOGO', min: 'tienda' },
  { id: 'locations', label: 'Stock por sucursal o almacén', group: 'CATALOGO', min: 'comercio', limit: { comercio: 3 } },
  { id: 'reviews', label: 'Reseñas con moderación', group: 'CATALOGO', min: 'comercio' },

  // Ventas
  { id: 'whatsapp_checkout', label: 'Pedido por WhatsApp con mensaje armado', group: 'VENTAS', min: 'escaparate' },
  { id: 'online_payments', label: 'Pago en línea (QR, link, pasarela)', group: 'VENTAS', min: 'tienda' },
  { id: 'taxes', label: 'IVA y precios con impuesto incluido', group: 'VENTAS', min: 'tienda' },
  { id: 'coupons', label: 'Cupones y descuentos', group: 'VENTAS', min: 'tienda' },
  { id: 'order_lifecycle', label: 'Estados de pedido y comprobantes', group: 'VENTAS', min: 'tienda' },
  { id: 'shipping_zones', label: 'Zonas, tarifas y retiro en tienda', group: 'VENTAS', min: 'comercio' },
  { id: 'returns', label: 'Devoluciones y reembolsos', group: 'VENTAS', min: 'comercio' },
  { id: 'customers', label: 'Ficha de cliente con historial', group: 'VENTAS', min: 'comercio' },

  // Gestión
  { id: 'dashboard', label: 'Panel con ventas del día y stock bajo', group: 'GESTION', min: 'escaparate' },
  { id: 'roles', label: 'Usuarios con roles y permisos', group: 'GESTION', min: 'comercio', limit: { comercio: 5 } },
  { id: 'audit', label: 'Registro de actividad', group: 'GESTION', min: 'comercio' },
  { id: 'exports', label: 'Exportar pedidos y productos (CSV)', group: 'GESTION', min: 'comercio' },

  // Personalización
  { id: 'theme', label: 'Editor de tema en vivo', group: 'PERSONALIZACION', min: 'tienda' },
  { id: 'home_blocks', label: 'Bloques de portada', group: 'PERSONALIZACION', min: 'tienda', limit: { tienda: 3 } },
  { id: 'domain', label: 'Dominio propio', group: 'PERSONALIZACION', min: 'tienda' },
  { id: 'custom_css', label: 'CSS y componentes propios', group: 'PERSONALIZACION', min: 'distribuidor' },
  { id: 'multi_brand', label: 'Varias marcas en una cuenta', group: 'PERSONALIZACION', min: 'distribuidor' },

  // Automatización
  { id: 'automations', label: 'Reglas automáticas', group: 'AUTOMATIZACION', min: 'comercio', limit: { comercio: 10 } },
  { id: 'notifications', label: 'Avisos al cliente y al equipo', group: 'AUTOMATIZACION', min: 'comercio' },
  { id: 'abandoned_cart', label: 'Recuperación de carrito abandonado', group: 'AUTOMATIZACION', min: 'comercio' },
  { id: 'reports', label: 'Reportes por producto, ciudad y periodo', group: 'AUTOMATIZACION', min: 'comercio' },

  // Escala
  { id: 'api_read', label: 'API de lectura y tokens', group: 'ESCALA', min: 'comercio' },
  { id: 'webhooks', label: 'Webhooks y API de escritura', group: 'ESCALA', min: 'distribuidor' },
  { id: 'ai_catalog', label: 'IA de catálogo: descripciones y precios', group: 'ESCALA', min: 'distribuidor' },
  { id: 'ab_testing', label: 'Pruebas A/B de portada y precios', group: 'ESCALA', min: 'distribuidor' },
  { id: 'sso', label: 'SSO y SLA con soporte dedicado', group: 'ESCALA', min: 'distribuidor' },
] as const satisfies readonly Feature[];

export type FeatureId = (typeof FEATURES)[number]['id'];

export const FEATURE_BY_ID = Object.fromEntries(
  FEATURES.map((f) => [f.id, f]),
) as Record<FeatureId, Feature>;

export const GROUPS: FeatureGroup[] = [
  'CATALOGO',
  'VENTAS',
  'GESTION',
  'PERSONALIZACION',
  'AUTOMATIZACION',
  'ESCALA',
];

export const GROUP_LABEL: Record<FeatureGroup, string> = {
  CATALOGO: 'Catálogo',
  VENTAS: 'Ventas',
  GESTION: 'Gestión',
  PERSONALIZACION: 'Personalización',
  AUTOMATIZACION: 'Automatización',
  ESCALA: 'Escala',
};
