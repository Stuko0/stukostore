// StukoStore — modelo de datos de la demo.
// La misma forma se usará en SQLite cuando la capa de datos pase a Go; por eso
// cada entidad lleva id propio, tenantId explícito y marcas de tiempo ISO.

import type { TierId } from './tiers';

export interface TenantTheme {
  barBg: string;
  barFg: string;
  accent: string;
  font: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  monogram: string;
  tagline: string;
  city: string;
  whatsapp: string;
  taxRate: number;
  domain: string | null;
  plan: TierId;
  theme: TenantTheme;
  footerBrand: boolean;
}

export interface Location {
  id: string;
  tenantId: string;
  name: string;
  city: string;
  address: string;
  pickup: boolean;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Variant {
  id: string;
  sku: string;
  options: Record<string, string>;
  price: number;
  compareAt: number | null;
  cost: number;
  barcode: string | null;
  active: boolean;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export type ProductStatus = 'borrador' | 'activo' | 'archivado';

export interface Product {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description: string;
  status: ProductStatus;
  collectionIds: string[];
  tags: string[];
  options: ProductOption[];
  variants: Variant[];
  images: ProductImage[];
  seo: { title: string; description: string };
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description: string;
  automatic: boolean;
  rule: string | null;
}

export interface InventoryLevel {
  id: string; // tenantId:variantId:locationId
  tenantId: string;
  variantId: string;
  locationId: string;
  qty: number;
  lowStockAt: number;
}

export type MovementReason =
  | 'entrada'
  | 'venta'
  | 'devolucion'
  | 'ajuste'
  | 'transferencia'
  | 'perdida';

export interface InventoryMovement {
  id: string;
  tenantId: string;
  variantId: string;
  locationId: string;
  qty: number;
  reason: MovementReason;
  note: string;
  actor: string;
  at: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  tags: string[];
  notes: string;
  createdAt: string;
}

export interface Address {
  line1: string;
  city: string;
  zone: string;
  reference: string;
}

export type OrderStatus =
  | 'pendiente'
  | 'pagado'
  | 'preparando'
  | 'enviado'
  | 'entregado'
  | 'cancelado'
  | 'devuelto';

export type PaymentMethod = 'qr' | 'transferencia' | 'contra-entrega' | 'pasarela';
export type ShippingMethod = 'retiro' | 'local' | 'nacional';

export interface OrderItem {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  options: Record<string, string>;
  qty: number;
  price: number;
}

export interface OrderEvent {
  at: string;
  actor: string;
  type: string;
  message: string;
}

export interface ReturnRecord {
  id: string;
  at: string;
  items: { variantId: string; qty: number }[];
  reason: string;
  refund: number;
  restocked: boolean;
}

export interface Order {
  id: string;
  tenantId: string;
  code: string;
  customerId: string | null;
  customer: { name: string; phone: string; email: string; city: string; address: Address | null };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentProof: string | null;
  shippingMethod: ShippingMethod;
  internalNotes: string[];
  returns: ReturnRecord[];
  events: OrderEvent[];
  createdAt: string;
  updatedAt: string;
}

export type DiscountType = 'porcentaje' | 'monto' | 'envio';

export interface Discount {
  id: string;
  tenantId: string;
  code: string;
  type: DiscountType;
  value: number;
  minSubtotal: number;
  active: boolean;
  used: number;
  limit: number | null;
}

export interface ShippingZone {
  id: string;
  tenantId: string;
  name: string;
  cities: string[];
  rate: number;
  freeAbove: number | null;
}

export interface AutomationRun {
  at: string;
  result: 'ejecutada' | 'omitida' | 'error';
  detail: string;
}

export interface Automation {
  id: string;
  tenantId: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  template: string;
  enabled: boolean;
  runs: AutomationRun[];
}

export interface SitePage {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  body: string;
}

export type BlockType = 'hero' | 'grilla' | 'banner' | 'texto' | 'faq';

export interface HomeBlock {
  id: string;
  tenantId: string;
  type: BlockType;
  title: string;
  body: string;
  collectionId: string | null;
  image: string | null;
  alt: string;
  visible: boolean;
}

export interface CartLine {
  variantId: string;
  productId: string;
  title: string;
  options: Record<string, string>;
  price: number;
  qty: number;
  image: string | null;
}

export interface NewOrderInput {
  tenantId: string;
  customer: { name: string; phone: string; email: string; city: string; address: Address | null };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
}

export interface TenantStats {
  ordersToday: number;
  salesToday: number;
  ordersMonth: number;
  salesMonth: number;
  avgTicket: number;
  pendingOrders: number;
  lowStock: { variantId: string; productTitle: string; sku: string; qty: number; lowStockAt: number }[];
  topProducts: { title: string; qty: number; total: number }[];
  salesByDay: { day: string; total: number }[];
  salesByCity: { city: string; total: number }[];
  productCount: number;
  activeProductCount: number;
  customerCount: number;
}
