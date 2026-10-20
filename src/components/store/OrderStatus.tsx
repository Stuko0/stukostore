// Seguimiento de pedido por código. Acepta ?code=XXXX en la URL.

import { createSignal, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob, dateTime, optionLabel } from '../../lib/format';
import { STATUS_LABEL } from '../../lib/api/mock-orders';
import type { Order, Tenant } from '../../lib/types';
import './store.css';

export default function OrderStatus(props: { tenant: Tenant }) {
  const [code, setCode] = createSignal('');
  const [order, setOrder] = createSignal<Order | null>(null);
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  const lookup = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setError('');
    try {
      const api = await prepare();
      const found = await api.getOrderByCode(props.tenant.id, value);
      setOrder(found);
      if (!found) setError('No encontramos un pedido con ese código en esta tienda.');
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('code');
    if (fromUrl) {
      setCode(fromUrl);
      void lookup(fromUrl);
    }
  });

  return (
    <section class="shell track">
      <h1 class="h2">Estado del pedido</h1>
      <p class="caption" style="margin-top: var(--s-8)">
        Escribí el código que te dimos al confirmar la compra, por ejemplo TE-1001.
      </p>

      <form
        class="track__form"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(code());
        }}
      >
        <div class="checkout__field" style="flex:1">
          <label for="code">Código de pedido</label>
          <input id="code" value={code()} onInput={(e) => setCode(e.currentTarget.value)} />
        </div>
        <button class="ghost" type="submit" disabled={loading()}>
          {loading() ? 'Buscando' : 'Buscar'} <span aria-hidden="true">→</span>
        </button>
      </form>

      <Show when={error()}>
        <p class="checkout__error" role="alert">{error()}</p>
      </Show>

      <Show when={order()}>
        {(current) => (
          <article class="checkout__summary" style="border-color: var(--c-border)">
            <p class="eyebrow">Pedido {current().code}</p>
            <p class="h3" style="margin: var(--s-8) 0">{STATUS_LABEL[current().status]}</p>
            <p class="caption">Creado el {dateTime(current().createdAt)}</p>

            <ul class="checkout__lines" style="margin-top: var(--s-16)">
              <For each={current().items}>
                {(item) => (
                  <li class="checkout__line">
                    <span>
                      {item.qty} × {item.title}
                      <Show when={optionLabel(item.options)}>
                        <span class="caption"> · {optionLabel(item.options)}</span>
                      </Show>
                    </span>
                    <span>{bob(item.price * item.qty)}</span>
                  </li>
                )}
              </For>
            </ul>

            <div class="checkout__totals">
              <p class="checkout__line"><span>Envío</span><span>{current().shipping === 0 ? 'Gratis' : bob(current().shipping)}</span></p>
              <p class="checkout__line"><span>IVA</span><span>{bob(current().tax)}</span></p>
              <p class="checkout__total"><span>Total</span><span>{bob(current().total)}</span></p>
            </div>

            <div class="track__steps">
              <For each={current().events}>
                {(event) => (
                  <p class="track__step">
                    <strong>{event.type.toUpperCase()}</strong> — {event.message}
                    <span class="caption"> · {dateTime(event.at)}</span>
                  </p>
                )}
              </For>
            </div>
          </article>
        )}
      </Show>
    </section>
  );
}
