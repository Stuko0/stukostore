// Catálogo: tiendas, productos y colecciones.

import * as idb from './idb';
import { slugify } from '../format';
import type { Collection, Product, Tenant } from '../types';

export const tick = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 70));

const now = (): string => new Date().toISOString();

export async function listTenants(): Promise<Tenant[]> {
  await tick();
  const tenants = await idb.all<Tenant>('tenants');
  return tenants.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTenant(slug: string): Promise<Tenant | null> {
  await tick();
  const tenants = await idb.all<Tenant>('tenants');
  return tenants.find((t) => t.slug === slug) ?? null;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  await tick();
  return (await idb.get<Tenant>('tenants', id)) ?? null;
}

export async function saveTenant(tenant: Tenant): Promise<Tenant> {
  await tick();
  await idb.put('tenants', tenant);
  return tenant;
}

export async function listProducts(tenantId: string): Promise<Product[]> {
  await tick();
  const products = await idb.byTenant<Product>('products', tenantId);
  return products.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProduct(id: string): Promise<Product | null> {
  await tick();
  return (await idb.get<Product>('products', id)) ?? null;
}

export async function getProductBySlug(tenantId: string, slug: string): Promise<Product | null> {
  await tick();
  const products = await idb.byTenant<Product>('products', tenantId);
  return products.find((p) => p.slug === slug) ?? null;
}

export async function saveProduct(product: Product): Promise<Product> {
  await tick();
  const next: Product = {
    ...product,
    slug: product.slug || slugify(product.title),
    updatedAt: now(),
    createdAt: product.createdAt || now(),
  };
  await idb.put('products', next);
  return next;
}

export async function setProductStatus(id: string, status: Product['status']): Promise<Product> {
  await tick();
  const product = await idb.get<Product>('products', id);
  if (!product) throw new Error('Producto no encontrado');
  const next = { ...product, status, updatedAt: now() };
  await idb.put('products', next);
  return next;
}

export async function duplicateProduct(id: string): Promise<Product> {
  await tick();
  const product = await idb.get<Product>('products', id);
  if (!product) throw new Error('Producto no encontrado');
  const suffix = `copia-${Date.now().toString().slice(-4)}`;
  const copy: Product = {
    ...product,
    id: `${product.id}-${suffix}`,
    slug: `${product.slug}-${suffix}`,
    title: `${product.title} (copia)`,
    status: 'borrador',
    variants: product.variants.map((v, i) => ({ ...v, id: `${product.id}-${suffix}-v${i + 1}` })),
    createdAt: now(),
    updatedAt: now(),
  };
  await idb.put('products', copy);
  return copy;
}

export async function searchProducts(tenantId: string, query: string): Promise<Product[]> {
  await tick();
  const products = await idb.byTenant<Product>('products', tenantId);
  const q = query.trim().toLowerCase();
  if (!q) return products.filter((p) => p.status === 'activo');
  return products.filter((p) => {
    if (p.status !== 'activo') return false;
    const haystack = [p.title, p.description, ...p.tags].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

export async function listCollections(tenantId: string): Promise<Collection[]> {
  await tick();
  const collections = await idb.byTenant<Collection>('collections', tenantId);
  return collections.sort((a, b) => a.title.localeCompare(b.title));
}

export async function saveCollection(collection: Collection): Promise<Collection> {
  await tick();
  const next: Collection = { ...collection, slug: collection.slug || slugify(collection.title) };
  await idb.put('collections', next);
  return next;
}
