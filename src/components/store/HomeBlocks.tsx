// Portada del storefront: se arma con los bloques guardados de la tienda.
// El plan activo decide cuántos bloques se publican, así que cambiar de plan
// se ve en la portada y no solo en la barra inferior.

import { For, Show, createSignal, onMount } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { can, limitFor, minTierFor, tierById } from '../../lib/tiers';
import { tier } from '../../lib/store';
import type { Collection, HomeBlock, Product, Tenant } from '../../lib/types';
import ProductGrid from './ProductGrid';
import './store.css';

export default function HomeBlocks(props: {
  tenant: Tenant;
  blocks: HomeBlock[];
  products: Product[];
  collections: Collection[];
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

  // ESCAPARATE: portada fija de dos bloques. TIENDA: hasta tres.
  // COMERCIO y DISTRIBUIDOR: todos los bloques publicados.
  const limit = (): number => {
    if (!can(tier(), 'home_blocks')) return 2;
    const value = limitFor(tier(), 'home_blocks');
    return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
  };

  const published = () => blocks().slice(0, limit());
  const hidden = () => Math.max(0, blocks().length - published().length);

  const forCollection = (collectionId: string | null): Product[] => {
    if (!collectionId) return products();
    return products().filter((p) => p.collectionIds.includes(collectionId));
  };

  const firstCollectionSlug = (): string => {
    const grilla = blocks().find((b) => b.type === 'grilla' && b.collectionId);
    const id = grilla?.collectionId ?? props.collections[0]?.id;
    const found = props.collections.find((c) => c.id === id) ?? props.collections[0];
    return found?.slug ?? '';
  };

  const nextPlan = () =>
    can(tier(), 'home_blocks') ? tierById('comercio') : tierById(minTierFor('home_blocks'));


  return (
    <>
      <For each={published()}>
        {(block) => (
          <>
            <Show when={block.type === 'hero'}>
              <section class="hero-block">
                <Show when={block.image}>
                  <div class="hero-block__media reveal-media">
                    <img src={block.image!} alt={block.alt} width="1440" height="620" />
                  </div>
                </Show>
                <div class="shell hero-block__text reveal">
                  <p class="eyebrow">{props.tenant.tagline}</p>
                  <h1 class="hero-block__title">{block.title}</h1>
                  <Show when={block.body}>
                    <p class="hero-block__body">{block.body}</p>
                  </Show>
                  <a class="btn btn--primary" href={`/t/${props.tenant.slug}/c/${firstCollectionSlug()}/`}>
                    Ver catálogo <span aria-hidden="true">→</span>
                  </a>
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
                  <div class="text-block__inner reveal">
                    <p class="eyebrow">Beneficio</p>
                    <h2 class="text-block__title">{block.title}</h2>
                    <p class="text-block__body">{block.body}</p>
                  </div>
                </div>
              </section>
            </Show>
          </>
        )}
      </For>

      <section class="plan-notice">
        <div class="shell plan-notice__inner">
          <p class="eyebrow">Plan de la demo</p>
          {/* Un solo nodo de texto con la expresión completa: es la forma que
              Solid sí vuelve a enlazar al hidratar. Varias interpolaciones en el
              mismo párrafo se quedan con el valor pre-renderizado. */}
          <p class="plan-notice__text">
            {hidden() > 0
              ? `Plan ${tierById(tier()).name} (Bs. ${tierById(tier()).bob} / mes): esta portada publica ${published().length} de ${blocks().length} bloques. Los ${hidden()} restantes se publican desde el plan ${nextPlan().name} (Bs. ${nextPlan().bob} / mes).`
              : `Plan ${tierById(tier()).name} (Bs. ${tierById(tier()).bob} / mes): portada completa con ${blocks().length} bloques publicados, búsqueda, cupones y envío nacional habilitados.`}
          </p>
          <a class="ghost" href="/precios/">Ver planes</a>
        </div>
      </section>
    </>
  );
}
