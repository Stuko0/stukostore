// Estado de interfaz compartido entre islas: plan activo, tienda activa y
// carrito. Vive en localStorage y se expone como señales de Solid para que
// cualquier isla de la página reaccione al mismo valor.

import { createSignal } from 'solid-js';
import { TIERS, type TierId } from './tiers';
import type { CartLine } from './types';

const KEY_TIER = 'stukostore.tier';
const KEY_TENANT = 'stukostore.tenant';
const KEY_CART = (tenantId: string) => `stukostore.cart.${tenantId}`;

function read(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* almacenamiento bloqueado: la demo sigue funcionando en memoria */
  }
}

function isTier(value: string | null): value is TierId {
  return !!value && TIERS.some((t) => t.id === value);
}

export const [tier, setTierValue] = createSignal<TierId>('tienda');
export const [tenantSlug, setTenantSlugValue] = createSignal<string>('tienda-express');
export const [cart, setCart] = createSignal<CartLine[]>([]);
export const [cartOpen, setCartOpen] = createSignal(false);
export const [cartTenantId, setCartTenantId] = createSignal<string>('');

/** Lee lo guardado en el navegador. Se llama una vez al montar la primera isla. */
export function hydrateSession(): void {
  if (typeof window === 'undefined') return;

  const fromUrl = new URLSearchParams(window.location.search).get('tier');
  const storedTier = read(KEY_TIER);
  if (isTier(fromUrl)) setTierValue(fromUrl);
  else if (isTier(storedTier)) setTierValue(storedTier);

  const storedTenant = read(KEY_TENANT);
  if (storedTenant) setTenantSlugValue(storedTenant);
}

export function applyTier(id: TierId, options: { syncUrl?: boolean } = {}): void {
  setTierValue(id);
  write(KEY_TIER, id);
  if (!options.syncUrl || typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('tier', id);
  window.history.replaceState({}, '', url);
}

export function rememberTenant(slug: string): void {
  setTenantSlugValue(slug);
  write(KEY_TENANT, slug);
}

export function loadCart(tenantId: string): void {
  if (!tenantId) return;
  const raw = read(KEY_CART(tenantId));
  if (!raw) {
    setCartTenantId(tenantId);
    setCart([]);
    return;
  }
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    setCartTenantId(tenantId);
    setCart(Array.isArray(parsed) ? parsed : []);
  } catch {
    setCartTenantId(tenantId);
    setCart([]);
  }
}

function persistCart(tenantId: string, lines: CartLine[]): void {
  write(KEY_CART(tenantId), JSON.stringify(lines));
}

export function addToCart(tenantId: string, line: CartLine): void {
  if (cartTenantId() !== tenantId) loadCart(tenantId);
  const current = cart();
  const existing = current.find((l) => l.variantId === line.variantId);
  const next = existing
    ? current.map((l) => (l.variantId === line.variantId ? { ...l, qty: l.qty + line.qty } : l))
    : [...current, line];
  setCart(next);
  persistCart(tenantId, next);
  setCartOpen(true);
}

export function setLineQty(tenantId: string, variantId: string, qty: number): void {
  const next = qty <= 0
    ? cart().filter((l) => l.variantId !== variantId)
    : cart().map((l) => (l.variantId === variantId ? { ...l, qty } : l));
  setCart(next);
  persistCart(tenantId, next);
}

export function removeLine(tenantId: string, variantId: string): void {
  setLineQty(tenantId, variantId, 0);
}

export function clearCart(tenantId: string): void {
  setCart([]);
  persistCart(tenantId, []);
}

export function cartSubtotal(): number {
  return cart().reduce((sum, l) => sum + l.price * l.qty, 0);
}

export function cartCount(): number {
  return cart().reduce((sum, l) => sum + l.qty, 0);
}
