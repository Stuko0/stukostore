// Portada del storefront: se arma con los bloques guardados de la tienda.

import { For, Show, createSignal, onMount } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import type { HomeBlock, Product, Tenant } from '../../lib/types';
import ProductGrid from './ProductGrid';
import './store.css';

export default function HomeBlocks(props: {
  tenant: Tenant;
  blocks: HomeBlock[];
  products: Product[];
}) {
  const [blocks, setBlocks] = createSignal<HomeBlock[]>(props.blocks);
  const [products, setProducts] = createSignal<Product[]>(
    props.products.filter((p) => p.status === 'activo'),
  );

  onMount(async () => {
    const api = await prepare();
    const [live, liveProducts] = await Promise.all([
      api.listBlocks(props.tenant.id),
      api.listProducts(props.tenant.id),
    ]);
    setBlocks(live);
    setProducts(liveProducts.filter((p) => p.status === 'activo'));
  });

  const forCollection = (collectionId: string | null): Product[] => {
    if (!collectionId) return products();
    return products().filter((p) => p.collectionIds.includes(collectionId));
  };

  return (
    <>
      <For each={blocks()}>
        {(block) => (
          <>
            <Show when={block.type === 'hero'}>
              <section class="hero-block">
                <Show when={block.image}>
                  <div class="hero-block__media">
                    <img src={block.image!} alt={block.alt} width="1440" height="460" />
                  </div>
                </Show>
                <div class="shell hero-block__text">
                  <h1 class="hero-block__title">{block.title}</h1>
                  <Show when={block.body}>
                    <p class="hero-block__body">{block.body}</p>
                  </Show>
                </div>
              </section>
            </Show>

            <Show when={block.type === 'grilla'}>
              <ProductGrid
                tenant={props.tenant}
                products={forCollection(block.collectionId)}
                title={block.title}
              />
            </Show>

            <Show when={block.type === 'texto' || block.type === 'banner'}>
              <section class="text-block">
                <div class="shell">
                  <h2 class="text-block__title">{block.title}</h2>
                  <p class="text-block__body">{block.body}</p>
                </div>
              </section>
            </Show>
          </>
        )}
      </For>
    </>
  );
}
