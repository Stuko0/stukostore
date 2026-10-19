// Métricas del panel. Todo se calcula sobre los datos guardados: ningún
// número de la demo está escrito a mano.

import * as idb from './idb';
import { tick } from './mock-catalog';
import type { Customer, InventoryLevel, Order, Product, TenantStats } from '../types';

const dayKey = (iso: string): string => {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const isCancelled = (o: Order): boolean => o.status === 'cancelado';

export async function stats(tenantId: string): Promise<TenantStats> {
  await tick();
  const orders = await idb.byTenant<Order>('orders', tenantId);
  const products = await idb.byTenant<Product>('products', tenantId);
  const customers = await idb.byTenant<Customer>('customers', tenantId);
  const inventory = await idb.byTenant<InventoryLevel>('inventory', tenantId);

  // Los pedidos de la demo se siembran con fechas relativas; "hoy" es el
  // pedido más reciente para que el panel tenga datos aunque la demo se abra
  // semanas después.
  const latest = orders.map((o) => o.createdAt).sort().at(-1) ?? new Date().toISOString();
  const today = dayKey(latest);
  const month = today.slice(0, 7);

  const valid = orders.filter((o) => !isCancelled(o));
  const fromToday = valid.filter((o) => dayKey(o.createdAt) === today);
  const fromMonth = valid.filter((o) => dayKey(o.createdAt).startsWith(month));

  const sum = (list: Order[]): number => list.reduce((acc, o) => acc + o.total, 0);

  const variantIndex = new Map<string, { title: string; sku: string }>();
  for (const product of products) {
    for (const variant of product.variants) {
      variantIndex.set(variant.id, { title: product.title, sku: variant.sku });
    }
  }

  const lowStockMap = new Map<string, { qty: number; lowStockAt: number }>();
  for (const level of inventory) {
    const current = lowStockMap.get(level.variantId);
    lowStockMap.set(level.variantId, {
      qty: (current?.qty ?? 0) + level.qty,
      lowStockAt: level.lowStockAt,
    });
  }
  const lowStock = [...lowStockMap.entries()]
    .filter(([, v]) => v.qty <= v.lowStockAt)
    .map(([variantId, v]) => ({
      variantId,
      productTitle: variantIndex.get(variantId)?.title ?? 'Producto',
      sku: variantIndex.get(variantId)?.sku ?? variantId,
      qty: v.qty,
      lowStockAt: v.lowStockAt,
    }))
    .sort((a, b) => a.qty - b.qty);

  const productTotals = new Map<string, { qty: number; total: number }>();
  for (const order of valid) {
    for (const item of order.items) {
      const current = productTotals.get(item.title) ?? { qty: 0, total: 0 };
      productTotals.set(item.title, {
        qty: current.qty + item.qty,
        total: current.total + item.qty * item.price,
      });
    }
  }
  const topProducts = [...productTotals.entries()]
    .map(([title, v]) => ({ title, qty: v.qty, total: v.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const days: { day: string; total: number }[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - i);
    const key = dayKey(d.toISOString());
    days.push({
      day: key,
      total: valid.filter((o) => dayKey(o.createdAt) === key).reduce((a, o) => a + o.total, 0),
    });
  }

  const cityTotals = new Map<string, number>();
  for (const order of valid) {
    const city = order.customer.city || 'Sin ciudad';
    cityTotals.set(city, (cityTotals.get(city) ?? 0) + order.total);
  }

  return {
    ordersToday: fromToday.length,
    salesToday: sum(fromToday),
    ordersMonth: fromMonth.length,
    salesMonth: sum(fromMonth),
    avgTicket: fromMonth.length ? sum(fromMonth) / fromMonth.length : 0,
    pendingOrders: orders.filter((o) => ['pendiente', 'pagado', 'preparando'].includes(o.status)).length,
    lowStock,
    topProducts,
    salesByDay: days,
    salesByCity: [...cityTotals.entries()]
      .map(([city, total]) => ({ city, total }))
      .sort((a, b) => b.total - a.total),
    productCount: products.length,
    activeProductCount: products.filter((p) => p.status === 'activo').length,
    customerCount: customers.length,
  };
}
