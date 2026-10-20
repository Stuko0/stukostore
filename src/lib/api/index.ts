// Interfaz única de datos de la demo.
// `MockAPI` (IndexedDB) la implementa hoy; `HttpAPI` (Go + SQLite) la
// implementará en la fase 12 sin tocar ningún componente.

import type {
  Automation,
  CartLine,
  Collection,
  Customer,
  Discount,
  HomeBlock,
  InventoryLevel,
  InventoryMovement,
  MovementReason,
  Order,
  OrderStatus,
  Product,
  ReturnRecord,
  ShippingZone,
  SitePage,
  Tenant,
  TenantStats,
} from '../types';

export interface AdjustStockInput {
  tenantId: string;
  variantId: string;
  locationId: string;
  qty: number;
  reason: MovementReason;
  note: string;
  actor: string;
}

export interface OrderDraft {
  tenantId: string;
  customer: Order['customer'];
  items: Order['items'];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: Order['paymentMethod'];
  shippingMethod: Order['shippingMethod'];
}

export interface StoreAPI {
  ready(): Promise<void>;
  resetDemo(): Promise<void>;

  listTenants(): Promise<Tenant[]>;
  getTenant(slug: string): Promise<Tenant | null>;
  getTenantById(id: string): Promise<Tenant | null>;
  saveTenant(tenant: Tenant): Promise<Tenant>;

  listProducts(tenantId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  getProductBySlug(tenantId: string, slug: string): Promise<Product | null>;
  saveProduct(product: Product): Promise<Product>;
  setProductStatus(id: string, status: Product['status']): Promise<Product>;
  duplicateProduct(id: string): Promise<Product>;
  searchProducts(tenantId: string, query: string): Promise<Product[]>;

  listCollections(tenantId: string): Promise<Collection[]>;
  saveCollection(collection: Collection): Promise<Collection>;

  listInventory(tenantId: string): Promise<InventoryLevel[]>;
  listMovements(tenantId: string, variantId?: string): Promise<InventoryMovement[]>;
  stockOf(tenantId: string, variantId: string): Promise<number>;
  adjustStock(input: AdjustStockInput): Promise<InventoryMovement>;

  listCustomers(tenantId: string): Promise<Customer[]>;

  listOrders(tenantId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByCode(tenantId: string, code: string): Promise<Order | null>;
  createOrder(draft: OrderDraft): Promise<Order>;
  setOrderStatus(id: string, status: OrderStatus, actor: string): Promise<Order>;
  addOrderNote(id: string, note: string, actor: string): Promise<Order>;
  attachPaymentProof(id: string, filename: string, actor: string): Promise<Order>;
  createReturn(
    id: string,
    items: { variantId: string; qty: number }[],
    reason: string,
    refund: number,
    restock: boolean,
    actor: string,
  ): Promise<Order>;

  listDiscounts(tenantId: string): Promise<Discount[]>;
  saveDiscount(discount: Discount): Promise<Discount>;
  findDiscount(tenantId: string, code: string): Promise<Discount | null>;
  listZones(tenantId: string): Promise<ShippingZone[]>;
  shippingFor(tenantId: string, city: string, subtotal: number): Promise<number>;

  listPages(tenantId: string): Promise<SitePage[]>;
  getPage(tenantId: string, slug: string): Promise<SitePage | null>;
  listBlocks(tenantId: string): Promise<HomeBlock[]>;

  listAutomations(tenantId: string): Promise<Automation[]>;
  toggleAutomation(id: string): Promise<Automation>;

  stats(tenantId: string): Promise<TenantStats>;
}

export type { CartLine, ReturnRecord };
