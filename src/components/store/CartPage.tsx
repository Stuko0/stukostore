// Vista de carrito a página completa, además del panel lateral.

import { onMount, For, Show } from 'solid-js';
import { bob, optionLabel } from '../../lib/format';
import { cart, cartSubtotal, cartCount, hydrateSession, loadCart, rememberTenant, setLineQty } from '../../lib/store';
import type { Tenant } from '../../lib/types';
import './store.css';

export default function CartPage(props: { tenant: Tenant }) {
  onMount(() => {
    hydrateSession();
    rememberTenant(props.tenant.slug);
    loadCart(props.tenant.id);
  });

  return (
    <section class="shell" style="padding: var(--s-40) 0 var(--s-64)">
      <h1 class="h2">Tu carrito</h1>

      <p class="caption" style="margin-top: var(--s-8)" classList={{ 'is-hidden': !cart().length }}>
        {cartCount()} unidades
      </p>

      <ul style="margin-top: var(--s-24)" classList={{ 'is-hidden': !cart().length }}>
        <For each={cart()}>
          {(line) => (
            <li
              style="display:flex; gap: var(--s-16); align-items:center; border-bottom: 1px solid var(--c-border); padding: var(--s-16) 0"
            >
              <Show when={line.image}>
                <img
                  src={line.image!}
                  alt=""
                  width="72"
                  height="72"
                  style="border:1px solid var(--c-border); border-radius: var(--r-md); object-fit: cover"
                />
              </Show>
              <div style="flex:1">
                <p class="cart__title">{line.title}</p>
                <Show when={optionLabel(line.options)}>
                  <p class="caption">{optionLabel(line.options)}</p>
                </Show>
                <p class="cart__price">{bob(line.price)}</p>
              </div>
              <div class="cart__qty">
                <button
                  onClick={() => setLineQty(props.tenant.id, line.variantId, line.qty - 1)}
                  aria-label={`Quitar una unidad de ${line.title}`}
                >
                  −
                </button>
                <span>{line.qty}</span>
                <button
                  onClick={() => setLineQty(props.tenant.id, line.variantId, line.qty + 1)}
                  aria-label={`Agregar una unidad de ${line.title}`}
                >
                  +
                </button>
              </div>
              <div style="min-width: 120px; text-align:right">
                <strong>{bob(line.price * line.qty)}</strong>
              </div>
            </li>
          )}
        </For>
      </ul>

      <div
        style="display:flex; justify-content:space-between; align-items:center; margin-top: var(--s-24); flex-wrap: wrap; gap: var(--s-16)"
        classList={{ 'is-hidden': !cart().length }}
      >
        <p class="h3">Subtotal {bob(cartSubtotal())}</p>
        <a class="ghost" href={`/t/${props.tenant.slug}/checkout/`}>
          Finalizar compra <span aria-hidden="true">→</span>
        </a>
      </div>

      <div classList={{ 'is-hidden': !!cart().length }} style="margin-top: var(--s-24)">
        <p class="empty">El carrito está vacío.</p>
        <p style="margin-top: var(--s-16)">
          <a class="ghost" href={`/t/${props.tenant.slug}/`}>
            Ver catálogo <span aria-hidden="true">→</span>
          </a>
        </p>
      </div>
    </section>
  );
}
