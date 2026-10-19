// Grilla de productos con acción de compra. Es la corrección directa del
// problema medido en la tienda original: ocho productos sin un solo botón.

import { createSignal, onMount, For, Show } from 'solid-js';
import { bob } from '../../lib/format';
import { addToCart, hydrateSession } from '../../lib/store';
import { prepare } from '../../lib/api/mock';
import type { Product, Tenant } from '../../lib/types';
import './store.css';

export function variantLabel(product: Product): string {
  const variant = product.variants.find((v) => v.active) ?? product.variants[0];
  return variant?.sku ?? '';
}

export function ProductCard(props: {
  product: Product;
  tenantSlug: string;
  stock: number | null;
  onAdd: (product: Product) => void;
}) {
  const variant = () => props.product.variants.find((v) => v.active) ?? props.product.variants[0];
  const image = () => props.product.images[0];

  return (
    <article class="product-card">
      <a class="product-card__link" href={`/t/${props.tenantSlug}/p/${props.product.slug}/`}>
        <Show when={image()}>
          <img src={image()!.src} alt={image()!.alt} width="600" height="600" loading="lazy" />
        </Show>
        <h3 class="product-card__title">{props.product.title}</h3>
        <p class="product-card__price">
          {bob(variant()?.price ?? 0)}
          <Show when={variant()?.compareAt}>
            <span class="product-card__compare"> {bob(variant()!.compareAt!)}</span>
          </Show>
        </p>
        <Show when={props.stock !== null}>
          <p class="product-card__stock">
            {props.stock === 0 ? 'Sin stock' : `${props.stock} disponibles`}
          </p>
        </Show>
      </a>
      <div class="product-card__actions">
        <button
          class="ghost"
          disabled={props.stock === 0}
          onClick={() => props.onAdd(props.product)}
        >
          {props.stock === 0 ? 'Sin stock' : 'Agregar'} <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

export default function ProductGrid(props: {
  tenant: Tenant;
  products: Product[];
  title: string;
  subtitle?: string;
  limit?: number;
}) {
  const [stock, setStock] = createSignal<Record<string, number>>({});
  const [message, setMessage] = createSignal('');

  const shown = () => (props.limit ? props.products.slice(0, props.limit) : props.products);

  onMount(async () => {
    hydrateSession();
    const api = await prepare();
    const levels = await api.listInventory(props.tenant.id);
    const totals: Record<string, number> = {};
    for (const level of levels) {
      totals[level.variantId] = (totals[level.variantId] ?? 0) + level.qty;
    }
    setStock(totals);
  });

  const add = (product: Product) => {
    const variant = product.variants.find((v) => v.active) ?? product.variants[0];
    if (!variant) return;
    addToCart(props.tenant.id, {
      variantId: variant.id,
      productId: product.id,
      title: product.title,
      options: variant.options,
      price: variant.price,
      qty: 1,
      image: product.images[0]?.src ?? null,
    });
    setMessage(`${product.title} agregado al carrito.`);
  };

  const available = (product: Product) => {
    const levels = stock();
    if (!Object.keys(levels).length) return null;
    return product.variants
      .filter((v) => v.active)
      .reduce((sum, v) => sum + (levels[v.id] ?? 0), 0);
  };

  return (
    <section class="grid-block">
      <div class="shell">
        <header class="grid-block__head">
          <h2 class="h2">{props.title}</h2>
          <p class="grid-block__count">
            {props.subtitle ?? `[${shown().length}]`}
          </p>
        </header>
        <div class="products">
          <For each={shown()}>
            {(product) => (
              <ProductCard
                product={product}
                tenantSlug={props.tenant.slug}
                stock={available(product)}
                onAdd={add}
              />
            )}
          </For>
        </div>
        <p class="empty" classList={{ 'is-hidden': !!shown().length }}>
          No hay productos en esta selección todavía.
        </p>
        <p class="sr-only" aria-live="polite">{message()}</p>
      </div>
    </section>
  );
}
