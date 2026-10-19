// Pedidos: creación, estados, notas, comprobantes y devoluciones.

import * as idb from './idb';
import { tick } from './mock-catalog';
import { consumeForSale, restockForReturn } from './mock-inventory';
import type {
  Customer,
  Discount,
  Order,
  OrderEvent,
  OrderStatus,
  ReturnRecord,
  ShippingZone,
} from '../types';

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

export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ['pagado', 'preparando', 'cancelado'],
  pagado: ['preparando', 'cancelado', 'devuelto'],
  preparando: ['enviado', 'cancelado'],
  enviado: ['entregado', 'devuelto'],
  entregado: ['devuelto'],
  cancelado: [],
  devuelto: [],
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  preparando: 'Preparando',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  devuelto: 'Devuelto',
};

function event(actor: string, type: string, message: string): OrderEvent {
  return { at: new Date().toISOString(), actor, type, message };
}

export async function listOrders(tenantId: string): Promise<Order[]> {
  await tick();
  const orders = await idb.byTenant<Order>('orders', tenantId);
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: string): Promise<Order | null> {
  await tick();
  return (await idb.get<Order>('orders', id)) ?? null;
}

export async function getOrderByCode(tenantId: string, code: string): Promise<Order | null> {
  await tick();
  const orders = await idb.byTenant<Order>('orders', tenantId);
  return orders.find((o) => o.code.toLowerCase() === code.trim().toLowerCase()) ?? null;
}

export async function findCustomer(tenantId: string, phone: string): Promise<Customer | null> {
  const customers = await idb.byTenant<Customer>('customers', tenantId);
  return customers.find((c) => c.phone === phone) ?? null;
}

export async function createOrder(draft: OrderDraft): Promise<Order> {
  await tick();
  const orders = await idb.byTenant<Order>('orders', draft.tenantId);
  const nextNumber = 1000 + orders.length + 1;
  const prefix = draft.tenantId.toUpperCase();
  const order: Order = {
    id: `ord-${Date.now()}`,
    tenantId: draft.tenantId,
    code: `${prefix}-${nextNumber}`,
    customerId: null,
    customer: draft.customer,
    items: draft.items,
    subtotal: draft.subtotal,
    discount: draft.discount,
    couponCode: draft.couponCode,
    shipping: draft.shipping,
    tax: draft.tax,
    total: draft.total,
    status: 'pendiente',
    paymentMethod: draft.paymentMethod,
    paymentProof: null,
    shippingMethod: draft.shippingMethod,
    internalNotes: [],
    returns: [],
    events: [event('checkout', 'creado', `Pedido creado desde ${draft.shippingMethod}`)],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await idb.put('orders', order);
  await consumeForSale(draft.tenantId, draft.items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
    `Pedido ${order.code}`);

  const existing = await findCustomer(draft.tenantId, draft.customer.phone);
  if (!existing) {
    const customer: Customer = {
      id: `cu-${Date.now()}`,
      tenantId: draft.tenantId,
      name: draft.customer.name,
      phone: draft.customer.phone,
      email: draft.customer.email,
      city: draft.customer.city,
      tags: ['nuevo'],
      notes: '',
      createdAt: new Date().toISOString(),
    };
    await idb.put('customers', customer);
    order.customerId = customer.id;
  } else {
    order.customerId = existing.id;
  }
  await idb.put('orders', order);
  return order;
}

export async function setOrderStatus(id: string, status: OrderStatus, actor: string): Promise<Order> {
  await tick();
  const order = await idb.get<Order>('orders', id);
  if (!order) throw new Error('Pedido no encontrado');
  const next: Order = {
    ...order,
    status,
    updatedAt: new Date().toISOString(),
    events: [...order.events, event(actor, 'estado', `Estado: ${STATUS_LABEL[status]}`)],
  };
  await idb.put('orders', next);
  return next;
}

export async function addOrderNote(id: string, note: string, actor: string): Promise<Order> {
  await tick();
  const order = await idb.get<Order>('orders', id);
  if (!order) throw new Error('Pedido no encontrado');
  const next: Order = {
    ...order,
    internalNotes: [...order.internalNotes, note],
    updatedAt: new Date().toISOString(),
    events: [...order.events, event(actor, 'nota', note)],
  };
  await idb.put('orders', next);
  return next;
}

export async function attachPaymentProof(id: string, filename: string, actor: string): Promise<Order> {
  await tick();
  const order = await idb.get<Order>('orders', id);
  if (!order) throw new Error('Pedido no encontrado');
  const next: Order = {
    ...order,
    paymentProof: filename,
    updatedAt: new Date().toISOString(),
    events: [...order.events, event(actor, 'comprobante', `Comprobante adjunto: ${filename}`)],
  };
  await idb.put('orders', next);
  return next;
}

export async function createReturn(
  id: string,
  items: { variantId: string; qty: number }[],
  reason: string,
  refund: number,
  restock: boolean,
  actor: string,
): Promise<Order> {
  await tick();
  const order = await idb.get<Order>('orders', id);
  if (!order) throw new Error('Pedido no encontrado');
  const record: ReturnRecord = {
    id: `ret-${Date.now()}`,
    at: new Date().toISOString(),
    items,
    reason,
    refund,
    restocked: restock,
  };
  const next: Order = {
    ...order,
    status: 'devuelto',
    returns: [...order.returns, record],
    updatedAt: new Date().toISOString(),
    events: [
      ...order.events,
      event(actor, 'devolucion', `Devolución por ${refund.toFixed(2)} Bs: ${reason}`),
    ],
  };
  await idb.put('orders', next);
  if (restock) await restockForReturn(order.tenantId, items, `Devolución de ${order.code}`);
  return next;
}

export async function listCustomers(tenantId: string): Promise<Customer[]> {
  await tick();
  const customers = await idb.byTenant<Customer>('customers', tenantId);
  return customers.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listDiscounts(tenantId: string): Promise<Discount[]> {
  await tick();
  return idb.byTenant<Discount>('discounts', tenantId);
}

export async function findDiscount(tenantId: string, code: string): Promise<Discount | null> {
  const discounts = await idb.byTenant<Discount>('discounts', tenantId);
  const found = discounts.find((d) => d.code.toLowerCase() === code.trim().toLowerCase() && d.active);
  return found ?? null;
}

export async function listZones(tenantId: string): Promise<ShippingZone[]> {
  await tick();
  return idb.byTenant<ShippingZone>('zones', tenantId);
}

export async function shippingFor(tenantId: string, city: string, subtotal: number): Promise<number> {
  const zones = await listZones(tenantId);
  const zone = zones.find((z) => z.cities.some((c) => c.toLowerCase() === city.toLowerCase()));
  if (!zone) return 0;
  if (zone.freeAbove !== null && subtotal >= zone.freeAbove) return 0;
  return zone.rate;
}
