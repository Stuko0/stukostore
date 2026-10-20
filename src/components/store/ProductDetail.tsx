// Detalle de producto: variantes, stock real y compra directa.

import { createSignal, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob, optionLabel } from '../../lib/format';
import { addToCart, hydrateSession } from '../../lib/store';
import type { Product, Tenant } from '../../lib/types';
import './store.css';

export default function ProductDetail(props: { tenant: Tenant; product: Product }) {
  const active = () => props.product.variants.find((v) => v.active) ?? props.product.variants[0];
  const [selected, setSelected] = createSignal(active());
  const [qty, setQty] = createSignal(1);
  const [stock, setStock] = createSignal<number | null>(null);
  const [message, setMessage] = createSignal('');
  const [error, setError] = createSignal('');

  onMount(async () => {
    hydrateSession();
    const api = await prepare();
    const levels = await api.listInventory(props.tenant.id);
    setStock(levels.filter((l) => l.variantId === selected().id).reduce((s, l) => s + l.qty, 0));
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
      <div class="detail__media">
        <Show when={props.product.images[0]}>
          <img
            src={props.product.images[0].src}
            alt={props.product.images[0].alt}
            width="800"
            height="800"
          />
        </Show>
      </div>

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
      </div>
    </article>
  );
}
