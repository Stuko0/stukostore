// Contenido: páginas legales, bloques de portada y automatizaciones.

import * as idb from './idb';
import { tick } from './mock-catalog';
import type { Automation, HomeBlock, SitePage } from '../types';

export async function listPages(tenantId: string): Promise<SitePage[]> {
  await tick();
  return idb.byTenant<SitePage>('pages', tenantId);
}

export async function getPage(tenantId: string, slug: string): Promise<SitePage | null> {
  await tick();
  const pages = await idb.byTenant<SitePage>('pages', tenantId);
  return pages.find((p) => p.slug === slug) ?? null;
}

export async function listBlocks(tenantId: string): Promise<HomeBlock[]> {
  await tick();
  const blocks = await idb.byTenant<HomeBlock>('blocks', tenantId);
  return blocks.filter((b) => b.visible);
}

export async function listAutomations(tenantId: string): Promise<Automation[]> {
  await tick();
  const items = await idb.byTenant<Automation>('automations', tenantId);
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function toggleAutomation(id: string): Promise<Automation> {
  await tick();
  const automation = await idb.get<Automation>('automations', id);
  if (!automation) throw new Error('Automatización no encontrada');
  const next: Automation = { ...automation, enabled: !automation.enabled };
  await idb.put('automations', next);
  return next;
}
