// Implementación de `StoreAPI` sobre IndexedDB.
// Es la única pieza que cambia cuando la demo pase a Go + SQLite.

import * as idb from './idb';
import { ensureSeeded, wipe } from './seed';
import * as catalog from './mock-catalog';
import * as inventory from './mock-inventory';
import * as orders from './mock-orders';
import * as content from './mock-content';
import { stats } from './mock-stats';
import type { AdjustStockInput, OrderDraft, StoreAPI } from './index';
import type { Discount, Order, OrderStatus, Product } from '../types';

export const api: StoreAPI = {
  async ready() {
    await ensureSeeded();
  },
  async resetDemo() {
    await wipe();
  },

  listTenants: catalog.listTenants,
  getTenant: catalog.getTenant,
  getTenantById: catalog.getTenantById,

  listProducts: catalog.listProducts,
  getProduct: catalog.getProduct,
  getProductBySlug: catalog.getProductBySlug,
  saveProduct: catalog.saveProduct,
  setProductStatus: catalog.setProductStatus,
  duplicateProduct: catalog.duplicateProduct,
  searchProducts: catalog.searchProducts,

  listCollections: catalog.listCollections,
  saveCollection: catalog.saveCollection,

  listInventory: inventory.listInventory,
  listMovements: inventory.listMovements,
  stockOf: inventory.stockOf,
  adjustStock: (input: AdjustStockInput) => inventory.adjustStock(input),

  listCustomers: orders.listCustomers,

  listOrders: orders.listOrders,
  getOrder: orders.getOrder,
  getOrderByCode: orders.getOrderByCode,
  createOrder: (draft: OrderDraft) => orders.createOrder(draft as never),
  setOrderStatus: (id: string, status: OrderStatus, actor: string) =>
    orders.setOrderStatus(id, status, actor),
  addOrderNote: (id: string, note: string, actor: string) => orders.addOrderNote(id, note, actor),
  attachPaymentProof: (id: string, filename: string, actor: string) =>
    orders.attachPaymentProof(id, filename, actor),
  createReturn: (
    id: string,
    items: { variantId: string; qty: number }[],
    reason: string,
    refund: number,
    restock: boolean,
    actor: string,
  ) => orders.createReturn(id, items, reason, refund, restock, actor),

  listDiscounts: orders.listDiscounts,
  async saveDiscount(discount: Discount) {
    await idb.put('discounts', discount);
    return discount;
  },
  findDiscount: orders.findDiscount,
  listZones: orders.listZones,
  shippingFor: orders.shippingFor,

  listPages: content.listPages,
  getPage: content.getPage,
  listBlocks: content.listBlocks,

  listAutomations: content.listAutomations,
  toggleAutomation: content.toggleAutomation,

  stats,
};

export type { Order, Product };
export { STATUS_FLOW, STATUS_LABEL } from './mock-orders';
export { listLocations } from './mock-inventory';

let ready: Promise<void> | null = null;

/** Devuelve la API con las semillas ya cargadas. */
export function getApi(): StoreAPI {
  return api;
}

export async function prepare(): Promise<StoreAPI> {
  if (!ready) ready = ensureSeeded();
  await ready;
  return api;
}
