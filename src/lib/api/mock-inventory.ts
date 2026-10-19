// Inventario: niveles por variante y ubicación, movimientos y ajustes.

import * as idb from './idb';
import { tick } from './mock-catalog';
import type { InventoryLevel, InventoryMovement, Location, MovementReason } from '../types';

export interface AdjustInput {
  tenantId: string;
  variantId: string;
  locationId: string;
  qty: number;
  reason: MovementReason;
  note: string;
  actor: string;
}

const REASON_MOVES_STOCK: Record<MovementReason, boolean> = {
  entrada: true,
  venta: true,
  devolucion: true,
  ajuste: true,
  transferencia: true,
  perdida: true,
};

export async function listInventory(tenantId: string): Promise<InventoryLevel[]> {
  await tick();
  return idb.byTenant<InventoryLevel>('inventory', tenantId);
}

export async function listMovements(tenantId: string, variantId?: string): Promise<InventoryMovement[]> {
  await tick();
  const movements = await idb.byTenant<InventoryMovement>('movements', tenantId);
  const filtered = variantId ? movements.filter((m) => m.variantId === variantId) : movements;
  return filtered.sort((a, b) => b.at.localeCompare(a.at));
}

export async function listLocations(tenantId: string): Promise<Location[]> {
  return idb.byTenant<Location>('locations', tenantId);
}

export async function stockOf(tenantId: string, variantId: string): Promise<number> {
  const levels = await idb.byTenant<InventoryLevel>('inventory', tenantId);
  return levels.filter((l) => l.variantId === variantId).reduce((sum, l) => sum + l.qty, 0);
}

async function applyLevel(tenantId: string, variantId: string, locationId: string, delta: number): Promise<void> {
  const id = `${variantId}:${locationId}`;
  const existing = await idb.get<InventoryLevel>('inventory', id);
  const level: InventoryLevel = existing ?? {
    id,
    tenantId,
    variantId,
    locationId,
    qty: 0,
    lowStockAt: 5,
  };
  level.qty = Math.max(0, level.qty + delta);
  await idb.put('inventory', level);
}

export async function adjustStock(input: AdjustInput): Promise<InventoryMovement> {
  await tick();
  if (REASON_MOVES_STOCK[input.reason]) {
    await applyLevel(input.tenantId, input.variantId, input.locationId, input.qty);
  }
  const movement: InventoryMovement = {
    id: `mv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tenantId: input.tenantId,
    variantId: input.variantId,
    locationId: input.locationId,
    qty: input.qty,
    reason: input.reason,
    note: input.note,
    actor: input.actor,
    at: new Date().toISOString(),
  };
  await idb.put('movements', movement);
  return movement;
}

/** Descuenta el stock vendido y deja el movimiento de venta. */
export async function consumeForSale(
  tenantId: string,
  items: { variantId: string; qty: number }[],
  note: string,
): Promise<void> {
  const locations = await listLocations(tenantId);
  const main = locations.find((l) => l.pickup) ?? locations[0];
  if (!main) return;
  for (const item of items) {
    await applyLevel(tenantId, item.variantId, main.id, -item.qty);
    await idb.put('movements', {
      id: `mv-${Date.now()}-${item.variantId}`,
      tenantId,
      variantId: item.variantId,
      locationId: main.id,
      qty: -item.qty,
      reason: 'venta' as const,
      note,
      actor: 'checkout',
      at: new Date().toISOString(),
    } satisfies InventoryMovement);
  }
}

/** Repone stock por una devolución aceptada. */
export async function restockForReturn(
  tenantId: string,
  items: { variantId: string; qty: number }[],
  note: string,
): Promise<void> {
  const locations = await listLocations(tenantId);
  const main = locations.find((l) => l.pickup) ?? locations[0];
  if (!main) return;
  for (const item of items) {
    await applyLevel(tenantId, item.variantId, main.id, item.qty);
    await idb.put('movements', {
      id: `mv-${Date.now()}-${item.variantId}-ret`,
      tenantId,
      variantId: item.variantId,
      locationId: main.id,
      qty: item.qty,
      reason: 'devolucion' as const,
      note,
      actor: 'equipo',
      at: new Date().toISOString(),
    } satisfies InventoryMovement);
  }
}
