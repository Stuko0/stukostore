// Buscador del storefront. Desde el plan TIENDA; en planes menores se muestra
// el estado bloqueado con el plan que lo habilita.

import { createSignal, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { can } from '../../lib/tiers';
import { addToCart, hydrateSession, tier } from '../../lib/store';
import type { Product, Tenant } from '../../lib/types';
import { ProductCard } from './ProductGrid';
import Locked from '../tier/Locked';
import './store.css';

export default function SearchStore(props: { tenant: Tenant; initialProducts: Product[] }) {
  const [query, setQuery] = createSignal('');
  const [results, setResults] = createSignal<Product[]>(props.initialProducts);
  const [searched, setSearched] = createSignal(false);
  const [stock, setStock] = createSignal<Record<string, number>>({});

  onMount(async () => {
    hydrateSession();
    const api = await prepare();
    const levels = await api.listInventory(props.tenant.id);
    const totals: Record<string, number> = {};
    for (const level of levels) totals[level.variantId] = (totals[level.variantId] ?? 0) + level.qty;
    setStock(totals);
  });

  const run = async (value: string) => {
    setQuery(value);
    setSearched(true);
    const api = await prepare();
    setResults(await api.searchProducts(props.tenant.id, value));
  };

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
  };

  return (
    <section class="shell search">
      <h1 class="h2">Buscar en {props.tenant.name}</h1>

      {can(tier(), 'search') ? (
        <>
          <label class="sr-only" for="q">Buscar productos</label>
          <input
            id="q"
            class="search__input"
            placeholder="Botella, molino, café…"
            value={query()}
            onInput={(e) => void run(e.currentTarget.value)}
            style="margin-top: var(--space-16)"
          />

          <p class="caption" aria-live="polite">
            {searched() ? `${results().length} resultados para "${query()}"` : 'Escribí para buscar.'}
          </p>

          <div class="products" style="margin-top: var(--space-24)">
            <For each={results()}>
              {(product) => (
                <ProductCard
                  product={product}
                  tenantSlug={props.tenant.slug}
                  stock={product.variants.reduce((s, v) => s + (stock()[v.id] ?? 0), 0)}
                  onAdd={add}
                />
              )}
            </For>
          </div>

          <Show when={searched() && results().length === 0}>
            <p class="empty">Sin resultados. Probá con otra palabra o mirá las categorías.</p>
          </Show>
        </>
      ) : (
        <div style="margin-top: var(--space-24)">
          <Locked feature="search" />
        </div>
      )}
    </section>
  );
}
