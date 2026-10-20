// Detalle de producto: variantes, stock real y compra directa.

import { createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { listLocations } from '../../lib/api/mock-inventory';
import { bob, optionLabel } from '../../lib/format';
import { addToCart, hydrateSession } from '../../lib/store';
import type { InventoryLevel, Location, Product, Tenant } from '../../lib/types';
import TierGate from '../tier/TierGate';
import './store.css';

export default function ProductDetail(props: { tenant: Tenant; product: Product }) {
  const active = () => props.product.variants.find((v) => v.active) ?? props.product.variants[0];
  const [selected, setSelected] = createSignal(active());
  const [qty, setQty] = createSignal(1);
  const [stock, setStock] = createSignal<number | null>(null);
  const [message, setMessage] = createSignal('');
  const [error, setError] = createSignal('');
  const [locations, setLocations] = createSignal<Location[]>([]);
  const [levels, setLevels] = createSignal<InventoryLevel[]>([]);
  const [photo, setPhoto] = createSignal(0);
  const [origin, setOrigin] = createSignal('50% 50%');
  const [zooming, setZooming] = createSignal(false);
  const [lightbox, setLightbox] = createSignal(false);

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
    };
    window.addEventListener('keydown', onKey);
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });

  onMount(async () => {
    hydrateSession();
    const api = await prepare();
    const [inventory, branches] = await Promise.all([
      api.listInventory(props.tenant.id),
      listLocations(props.tenant.id),
    ]);
    setLevels(inventory);
    setLocations(branches);
    setStock(inventory.filter((l) => l.variantId === selected().id).reduce((s, l) => s + l.qty, 0));
  });

  const pick = async (value: string) => {
    const key = props.product.options[0]?.name;
    const variant = props.product.variants.find((v) => (key ? v.options[key] === value : false)) ?? active();
    setSelected(variant);
    setQty(1);
    const api = await prepare();
    const levels = await api.listInventory(props.tenant.id);
    setStock(levels.filter((l) => l.variantId === variant.id).reduce((s, l) => s + l.qty, 0));
  };

  const add = () => {
    const variant = selected();
    if (stock() === 0) {
      setError('Sin stock en este momento. Probá con otra variante.');
      return;
    }
    if (qty() > (stock() ?? 99)) {
      setError(`Solo quedan ${stock()} unidades de esta variante.`);
      return;
    }
    setError('');
    addToCart(props.tenant.id, {
      variantId: variant.id,
      productId: props.product.id,
      title: props.product.title,
      options: variant.options,
      price: variant.price,
      qty: qty(),
      image: props.product.images[0]?.src ?? null,
    });
    setMessage(`${qty()} × ${props.product.title} en el carrito.`);
  };

  return (
    <article class="detail shell">
      <div class="detail__media gallery">
        <div
          class="gallery__main"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
          }}
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => setZooming(false)}
          onClick={() => setLightbox(true)}
        >
          <Show when={props.product.images[photo()]}>
            <img
              src={props.product.images[photo()].src}
              alt={props.product.images[photo()].alt}
              width="800"
              height="800"
              classList={{ 'is-zoomed': zooming() }}
              style={{ 'transform-origin': origin() }}
            />
          </Show>
          <span class="gallery__hint">Clic para ampliar</span>
        </div>

        <Show when={props.product.images.length > 1}>
          <div class="gallery__thumbs" role="group" aria-label="Imágenes del producto">
            <For each={props.product.images}>
              {(image, index) => (
                <button
                  class="gallery__thumb"
                  aria-pressed={photo() === index()}
                  aria-label={`Ver imagen ${index() + 1} de ${props.product.images.length}`}
                  onClick={() => setPhoto(index())}
                >
                  <img src={image.src} alt="" width="72" height="72" loading="lazy" />
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>

      <Show when={lightbox()}>
        <div
          class="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
          onClick={() => setLightbox(false)}
        >
          <button class="lightbox__close" onClick={() => setLightbox(false)}>Cerrar</button>
          <img src={props.product.images[photo()].src} alt={props.product.images[photo()].alt} />
        </div>
      </Show>

      <div>
        <p class="detail__crumbs">
          <a href={`/t/${props.tenant.slug}/`}>{props.tenant.name}</a> / {props.product.title}
        </p>
        <h1 class="detail__title">{props.product.title}</h1>

        <div class="detail__price">
          <strong>{bob(selected().price)}</strong>
          <Show when={selected().compareAt}>
            <span class="caption product-card__compare">{bob(selected().compareAt!)}</span>
          </Show>
        </div>

        <p class="detail__desc">{props.product.description}</p>

        <Show when={props.product.options.length}>
          <div class="detail__option">
            <p class="detail__option-label">{props.product.options[0].name}</p>
            <div class="detail__values">
              <For each={props.product.options[0].values}>
                {(value) => (
                  <button
                    class="detail__value"
                    aria-pressed={
                      selected().options[props.product.options[0].name] === value
                    }
                    onClick={() => void pick(value)}
                  >
                    {value}
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>

        <p class="detail__stock">
          SKU {selected().sku}
          <Show when={stock() !== null}> · {stock()} disponibles</Show>
        </p>
        <Show when={optionLabel(selected().options)}>
          <p class="caption">{optionLabel(selected().options)}</p>
        </Show>

        <div class="detail__actions">
          <div class="checkout__field">
            <label for="qty">Cantidad</label>
            <input
              id="qty"
              type="number"
              min="1"
              max="99"
              value={qty()}
              onInput={(e) => setQty(Math.max(1, Number(e.currentTarget.value) || 1))}
            />
          </div>
          <button class="ghost" onClick={add}>
            Agregar al carrito <span aria-hidden="true">→</span>
          </button>
        </div>

        <Show when={error()}>
          <p class="detail__feedback" role="alert" style="color: var(--c-error)">
            {error()}
          </p>
        </Show>
        <p class="detail__feedback" aria-live="polite">{message()}</p>

        {/* Stock por sucursal: función del plan COMERCIO. En planes menores se
            muestra el estado bloqueado con el plan que lo habilita. */}
        <TierGate feature="locations">
          <section class="detail__branches">
            <p class="eyebrow">Disponible en sucursales</p>
            <ul class="detail__branch-list">
              <For each={locations()}>
                {(location) => (
                  <li>
                    <span>{location.name}</span>
                    <span class="caption">
                      {(() => {
                        const qty = levels()
                          .filter((l) => l.variantId === selected().id && l.locationId === location.id)
                          .reduce((sum, l) => sum + l.qty, 0);
                        return qty > 0 ? `${qty} unidades` : 'Sin stock';
                      })()}
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </section>
        </TierGate>
      </div>
    </article>
  );
}
