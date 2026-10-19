// Acceso a las semillas en tiempo de build.
// Solo lo usan `getStaticPaths` y los layouts para pre-renderizar la primera
// pantalla. Los componentes leen siempre desde `StoreAPI`.

import { collectionSeed, productSeed, tenantSeed } from './api/seed';
import blocksSeed from '../data/seed/blocks.json';
import pagesSeed from '../data/seed/pages.json';
import type { Collection, HomeBlock, Product, SitePage, Tenant } from './types';

export const tenants: Tenant[] = tenantSeed;
export const products: Product[] = productSeed;
export const collections: Collection[] = collectionSeed;
export const blocks: HomeBlock[] = blocksSeed as unknown as HomeBlock[];
export const pages: SitePage[] = pagesSeed as unknown as SitePage[];

export function tenantBySlug(slug: string): Tenant {
  const tenant = tenants.find((t) => t.slug === slug);
  if (!tenant) throw new Error(`Tienda no encontrada: ${slug}`);
  return tenant;
}

export function collectionsOf(tenantId: string): Collection[] {
  return collections.filter((c) => c.tenantId === tenantId);
}

export function productsOf(tenantId: string): Product[] {
  return products.filter((p) => p.tenantId === tenantId);
}

export function blocksOf(tenantId: string): HomeBlock[] {
  return blocks.filter((b) => b.tenantId === tenantId && b.visible);
}

export function pagesOf(tenantId: string): SitePage[] {
  return pages.filter((p) => p.tenantId === tenantId);
}

export function tenantsPathParams(): { params: { tenant: string } }[] {
  return tenants.map((t) => ({ params: { tenant: t.slug } }));
}
