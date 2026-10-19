// Carrito del storefront: botón con contador y panel lateral con las líneas.

import { createSignal, onMount, For, Show } from 'solid-js';
import { bob, optionLabel } from '../../lib/format';
import {
  cart,
  cartCount,
  cartOpen,
  cartSubtotal,
  hydrateSession,
  loadCart,
  rememberTenant,
  setCartOpen,
  setLineQty,
} from '../../lib/store';
import './store.css';

export default function CartWidget(props: { tenantId: string; tenantSlug: string }) {
  const [ready, setReady] = createSignal(false);

  onMount(() => {
    hydrateSession();
    rememberTenant(props.tenantSlug);
    loadCart(props.tenantId);
    setReady(true);
  });

  return (
    <div class="cart">
      <button class="cart__button" onClick={() => setCartOpen(!cartOpen())} aria-expanded={cartOpen()}>
        Carrito [{ready() ? cartCount() : 0}]
      </button>

      <Show when={cartOpen()}>
        <aside class="cart__panel" aria-label="Carrito de compras">
          <header class="cart__head">
            <p class="eyebrow">Tu pedido</p>
            <button class="cart__close" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito">
              Cerrar
            </button>
          </header>

          <ul class="cart__lines" classList={{ 'is-hidden': !cart().length }}>
            <For each={cart()}>
              {(line) => (
                <li class="cart__line">
                  <Show when={line.image}>
                    <img src={line.image!} alt="" width="64" height="64" loading="lazy" />
                  </Show>
                  <div>
                    <p class="cart__title">{line.title}</p>
                    <Show when={optionLabel(line.options)}>
                      <p class="caption">{optionLabel(line.options)}</p>
                    </Show>
                    <p class="cart__price">{bob(line.price)}</p>
                    <div class="cart__qty">
                      <button
                        onClick={() => setLineQty(props.tenantId, line.variantId, line.qty - 1)}
                        aria-label={`Quitar una unidad de ${line.title}`}
                      >
                        −
                      </button>
                      <span aria-live="polite">{line.qty}</span>
                      <button
                        onClick={() => setLineQty(props.tenantId, line.variantId, line.qty + 1)}
                        aria-label={`Agregar una unidad de ${line.title}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              )}
            </For>
          </ul>

          <p class="cart__empty" classList={{ 'is-hidden': !!cart().length }}>
            Todavía no agregaste productos. El catálogo está a un clic.
          </p>

          <footer class="cart__foot" classList={{ 'is-hidden': !cart().length }}>
            <p class="cart__total">
              Subtotal <strong>{bob(cartSubtotal())}</strong>
            </p>
            <a class="ghost" href={`/t/${props.tenantSlug}/checkout/`}>
              Finalizar compra <span aria-hidden="true">→</span>
            </a>
          </footer>
        </aside>
      </Show>
    </div>
  );
}
