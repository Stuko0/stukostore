// Semillas y siembra inicial de la demo.
// Todo se guarda en IndexedDB la primera vez que el visitante abre el sitio.
// `SEED_VERSION` invalida la cache local cuando cambian los datos.

import * as idb from './idb';
import tenantsSeed from '../../data/seed/tenants.json';
import locationsSeed from '../../data/seed/locations.json';
import collectionsSeed from '../../data/seed/collections.json';
import productsSeed from '../../data/seed/products.json';
import customersSeed from '../../data/seed/customers.json';
import discountsSeed from '../../data/seed/discounts.json';
import zonesSeed from '../../data/seed/zones.json';
import automationsSeed from '../../data/seed/automations.json';
import pagesSeed from '../../data/seed/pages.json';
import blocksSeed from '../../data/seed/blocks.json';
import ordersSeed from '../../data/seed/orders.json';
import type {
  Automation,
  Collection,
  Customer,
  Discount,
  HomeBlock,
  InventoryLevel,
  InventoryMovement,
  Location,
  Order,
  Product,
  ShippingZone,
  SitePage,
  Tenant,
} from '../types';

export const SEED_VERSION = 3;

export const tenantSeed = tenantsSeed as unknown as Tenant[];
export const productSeed = productsSeed as unknown as Product[];
export const collectionSeed = collectionsSeed as unknown as Collection[];
export const orderSeed = ordersSeed as unknown as Order[];

/** Hash estable para generar cantidades sin aleatoriedad entre visitas. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildInventory(): InventoryLevel[] {
  const locations = locationsSeed as unknown as Location[];
  const levels: InventoryLevel[] = [];
  for (const product of productSeed) {
    const tenantLocations = locations.filter((l) => l.tenantId === product.tenantId);
    for (const variant of product.variants) {
      tenantLocations.forEach((location, index) => {
        const seed = hash(`${variant.id}:${location.id}`);
        const qty = index === 0 ? (seed % 8 === 0 ? 0 : seed % 32) : (seed % 24) + 6;
        levels.push({
          id: `${variant.id}:${location.id}`,
          tenantId: product.tenantId,
          variantId: variant.id,
          locationId: location.id,
          qty,
          lowStockAt: 5,
        });
      });
    }
  }
  return levels;
}

function buildMovements(levels: InventoryLevel[]): InventoryMovement[] {
  return levels.map((level, index) => ({
    id: `mv-${index + 1}`,
    tenantId: level.tenantId,
    variantId: level.variantId,
    locationId: level.locationId,
    qty: level.qty,
    reason: 'entrada' as const,
    note: 'Carga inicial de la demo',
    actor: 'sistema',
    at: '2026-08-15T09:00:00-04:00',
  }));
}

async function putSeeds(): Promise<void> {
  const levels = buildInventory();
  await idb.putMany('tenants', tenantSeed);
  await idb.putMany('locations', locationsSeed as unknown as Location[]);
  await idb.putMany('collections', collectionSeed);
  await idb.putMany('products', productSeed);
  await idb.putMany('customers', customersSeed as unknown as Customer[]);
  await idb.putMany('discounts', discountsSeed as unknown as Discount[]);
  await idb.putMany('zones', zonesSeed as unknown as ShippingZone[]);
  await idb.putMany('automations', automationsSeed as unknown as Automation[]);
  await idb.putMany('pages', pagesSeed as unknown as SitePage[]);
  await idb.putMany('blocks', blocksSeed as unknown as HomeBlock[]);
  await idb.putMany('orders', orderSeed);
  await idb.putMany('inventory', levels);
  await idb.putMany('movements', buildMovements(levels));
  await idb.put('meta', { id: 'seed', cacheVersion: SEED_VERSION, seeded: true });
}

export async function ensureSeeded(): Promise<void> {
  if (!idb.available()) throw new Error('IndexedDB no disponible: la demo necesita un navegador.');
  const meta = await idb.get<{ id: string; cacheVersion: number }>('meta', 'seed');
  if (meta && meta.cacheVersion === SEED_VERSION) return;
  await idb.clearAll();
  await putSeeds();
}

export async function wipe(): Promise<void> {
  await idb.clearAll();
  await putSeeds();
}
