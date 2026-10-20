// Grilla de productos con acción de compra, hover con zoom y, en las
// colecciones, filtros por etiqueta, disponibilidad, precio y orden.

import { createSignal, createMemo, onMount, For, Show } from 'solid-js';
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
  index?: number;
  onAdd: (product: Product) => void;
}) {
  const variant = () => props.product.variants.find((v) => v.active) ?? props.product.variants[0];
  const image = () => props.product.images[0];
  const onSale = () => !!variant()?.compareAt;

  return (
    <article
      class="product-card reveal"
      style={`transition-delay: ${Math.min((props.index ?? 0) * 70, 280)}ms`}
    >
      <a class="product-card__link" href={`/t/${props.tenantSlug}/p/${props.product.slug}/`}>
        <div class="product-card__media">
          <Show when={image()}>
            <img src={image()!.src} alt={image()!.alt} width="600" height="600" loading="lazy" />
          </Show>
          <Show when={onSale()}>
            <span class="tag tag--sale product-card__badge">Oferta</span>
          </Show>
        </div>
        <div class="product-card__info">
          <h3 class="product-card__title">{props.product.title}</h3>
          <p classList={{ 'product-card__price': true, 'product-card__price--sale': onSale() }}>
            {bob(variant()?.price ?? 0)}
            <Show when={onSale()}>
              <span class="product-card__compare">{bob(variant()!.compareAt!)}</span>
            </Show>
          </p>
          <Show when={props.stock !== null}>
            <p class="product-card__stock">
              {props.stock === 0 ? 'Sin stock' : `${props.stock} disponibles`}
            </p>
          </Show>
        </div>
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

type SortKey = 'destacado' | 'precio-asc' | 'precio-desc' | 'nombre';

function priceOf(product: Product): number {
  const variant = product.variants.find((v) => v.active) ?? product.variants[0];
  return variant?.price ?? 0;
}

export default function ProductGrid(props: {
  tenant: Tenant;
  products: Product[];
  title: string;
  subtitle?: string;
  limit?: number;
  enableFilters?: boolean;
  /** En páginas de categoría el título ya es el h1: no se repite. */
  hideHeading?: boolean;
}) {
  const [stock, setStock] = createSignal<Record<string, number>>({});
  const [message, setMessage] = createSignal('');
  const [tag, setTag] = createSignal('todas');
  const [sort, setSort] = createSignal<SortKey>('destacado');
  const [onlyStock, setOnlyStock] = createSignal(false);
  const [maxPrice, setMaxPrice] = createSignal(0);

  const all = () => (props.limit ? props.products.slice(0, props.limit) : props.products);

  const tags = createMemo(() => {
    const counts = new Map<string, number>();
    for (const product of all()) {
      for (const t of product.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  });

  const priceCeiling = createMemo(() => Math.ceil(Math.max(0, ...all().map(priceOf)) / 50) * 50);

  onMount(async () => {
    hydrateSession();
    const api = await prepare();
    const levels = await api.listInventory(props.tenant.id);
    const totals: Record<string, number> = {};
    for (const level of levels) {
      totals[level.variantId] = (totals[level.variantId] ?? 0) + level.qty;
    }
    setStock(totals);
    setMaxPrice(priceCeiling());

    // Estado inicial desde la URL, para poder compartir una vista filtrada.
    const params = new URLSearchParams(window.location.search);
    if (params.get('tag')) setTag(params.get('tag')!);
    if (params.get('orden')) setSort(params.get('orden') as SortKey);
    if (params.get('stock') === '1') setOnlyStock(true);
    if (params.get('max')) setMaxPrice(Number(params.get('max')));
  });

  const syncUrl = (patch: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    window.history.replaceState({}, '', url);
  };

  const available = (product: Product) => {
    const levels = stock();
    if (!Object.keys(levels).length) return null;
    return product.variants
      .filter((v) => v.active)
      .reduce((sum, v) => sum + (levels[v.id] ?? 0), 0);
  };

  const visible = createMemo(() => {
    const levels = stock();
    const hasStockInfo = Object.keys(levels).length > 0;
    let list = all().filter((product) => {
      if (tag() !== 'todas' && !product.tags.includes(tag())) return false;
      if (priceOf(product) > maxPrice()) return false;
      if (onlyStock() && hasStockInfo) {
        const qty = product.variants
          .filter((v) => v.active)
          .reduce((sum, v) => sum + (levels[v.id] ?? 0), 0);
        if (qty <= 0) return false;
      }
      return true;
    });
    const sorted = [...list];
    if (sort() === 'precio-asc') sorted.sort((a, b) => priceOf(a) - priceOf(b));
    if (sort() === 'precio-desc') sorted.sort((a, b) => priceOf(b) - priceOf(a));
    if (sort() === 'nombre') sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
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

  const reset = () => {
    setTag('todas');
    setSort('destacado');
    setOnlyStock(false);
    setMaxPrice(priceCeiling());
    syncUrl({ tag: null, orden: null, stock: null, max: null });
  };

  return (
    <section class="grid-block">
      <div class="shell">
        {/* En categorías el título ya es el h1 de la página: el encabezado de la
            grilla se mantiene en el árbol de accesibilidad pero no se muestra,
            para no duplicar el nombre ni romper el orden de encabezados. */}
        <header class="grid-block__head reveal" classList={{ 'sr-only': props.hideHeading }}>
          <h2 class="h2">{props.title}</h2>
          <p class="grid-block__count">{props.subtitle ?? `[${visible().length}]`}</p>
        </header>

        <Show when={props.enableFilters}>
          <div class="filters" role="group" aria-label="Filtros del catálogo">
            <div class="filters__row">
              <span class="filters__label">Etiqueta</span>
              <div class="filters__chips">
                <button
                  class="tag"
                  aria-pressed={tag() === 'todas'}
                  onClick={() => {
                    setTag('todas');
                    syncUrl({ tag: null });
                  }}
                >
                  Todas
                </button>
                <For each={tags()}>
                  {(item) => (
                    <button
                      class="tag"
                      aria-pressed={tag() === item.name}
                      onClick={() => {
                        setTag(item.name);
                        syncUrl({ tag: item.name });
                      }}
                    >
                      {item.name} <span class="caption">{item.count}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div class="filters__row">
              <span class="filters__label">Precio hasta</span>
              <input
                type="range"
                min="0"
                max={priceCeiling()}
                step="50"
                value={maxPrice()}
                aria-label="Precio máximo"
                onInput={(e) => {
                  setMaxPrice(Number(e.currentTarget.value));
                  syncUrl({ max: e.currentTarget.value });
                }}
              />
              <span class="filters__value">{bob(maxPrice())}</span>

              <label class="filters__check">
                <input
                  type="checkbox"
                  checked={onlyStock()}
                  onChange={(e) => {
                    setOnlyStock(e.currentTarget.checked);
                    syncUrl({ stock: e.currentTarget.checked ? '1' : null });
                  }}
                />
                Solo con stock
              </label>

              <label class="sr-only" for="sort">Ordenar por</label>
              <select
                id="sort"
                value={sort()}
                onChange={(e) => {
                  setSort(e.currentTarget.value as SortKey);
                  syncUrl({ orden: e.currentTarget.value });
                }}
              >
                <option value="destacado">Destacados</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
                <option value="nombre">Nombre A–Z</option>
              </select>

              <button class="link-button" onClick={reset}>Limpiar</button>
              <span class="caption" aria-live="polite">{visible().length} productos</span>
            </div>
          </div>
        </Show>

        <div class="products">
          <For each={visible()}>
            {(product, index) => (
              <ProductCard
                product={product}
                tenantSlug={props.tenant.slug}
                stock={available(product)}
                index={index()}
                onAdd={add}
              />
            )}
          </For>
        </div>

        <p class="empty" classList={{ 'is-hidden': !!visible().length }}>
          No hay productos con esos filtros. <button class="link-button" onClick={reset}>Limpiar filtros</button>
        </p>
        <p class="sr-only" aria-live="polite">{message()}</p>
      </div>
    </section>
  );
}
