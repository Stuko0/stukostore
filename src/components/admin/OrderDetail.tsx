// Detalle de pedido: estados, notas, comprobante, lista de empaque y devolución.

import { createSignal, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob, dateTime, optionLabel } from '../../lib/format';
import { STATUS_FLOW, STATUS_LABEL } from '../../lib/api/mock-orders';
import type { Order, Tenant } from '../../lib/types';
import './admin.css';

export default function OrderDetail(props: { tenant: Tenant; orderId?: string }) {
  const [order, setOrder] = createSignal<Order | null>(null);
  const [note, setNote] = createSignal('');
  const [proof, setProof] = createSignal('comprobante.jpg');
  const [returnQty, setReturnQty] = createSignal<Record<string, number>>({});
  const [reason, setReason] = createSignal('Producto con detalle');
  const [restock, setRestock] = createSignal(true);
  const [message, setMessage] = createSignal('');
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(true);

  const orderId = () =>
    props.orderId ?? new URLSearchParams(window.location.search).get('id') ?? '';

  const addressRef = (order: Order): string => {
    const address = order.customer.address;
    if (!address || !address.reference) return '';
    return ` (${address.reference})`;
  };

  const load = async () => {
    const api = await prepare();
    const found = await api.getOrder(orderId());
    setOrder(found);
    if (!found) setError('No encontramos ese pedido en esta tienda.');
    setLoading(false);
  };

  onMount(() => {
    void load();
  });

  const next = () => (order() ? STATUS_FLOW[order()!.status] : []);

  const move = async (status: Order['status']) => {
    const api = await prepare();
    await api.setOrderStatus(orderId(), status, 'panel');
    await load();
    setMessage(`Pedido marcado como ${STATUS_LABEL[status]}.`);
  };

  const saveNote = async () => {
    if (!note().trim()) return;
    const api = await prepare();
    await api.addOrderNote(orderId(), note(), 'panel');
    setNote('');
    await load();
    setMessage('Nota interna agregada.');
  };

  const attachProof = async () => {
    const api = await prepare();
    await api.attachPaymentProof(orderId(), proof(), 'panel');
    await load();
    setMessage('Comprobante adjunto al pedido.');
  };

  const refundTotal = () => {
    const current = order();
    if (!current) return 0;
    return current.items.reduce((sum, item) => sum + (returnQty()[item.variantId] ?? 0) * item.price, 0);
  };

  const submitReturn = async () => {
    const items = Object.entries(returnQty())
      .filter(([, qty]) => qty > 0)
      .map(([variantId, qty]) => ({ variantId, qty }));
    if (!items.length) {
      setError('Elegí al menos una unidad para devolver.');
      return;
    }
    setError('');
    const api = await prepare();
    await api.createReturn(orderId(), items, reason(), refundTotal(), restock(), 'panel');
    setReturnQty({});
    await load();
    setMessage(`Devolución registrada por ${bob(refundTotal())}${restock() ? ' y stock repuesto' : ''}.`);
  };

  return (
    <>
      <header class="admin__head">
        <div>
          <p class="eyebrow">Pedido</p>
          <h1 class="admin__title">{order()?.code ?? 'Pedido'}</h1>
        </div>
        <a class="link-button" href={`/admin/${props.tenant.slug}/pedidos/`}>Volver a la lista</a>
      </header>

      <Show when={!loading()} fallback={<p class="caption">Cargando pedido…</p>}>
        <Show when={error()}>
          <p class="notice notice--warn" role="alert">{error()}</p>
        </Show>
        <Show when={message()}>
          <p class="notice" aria-live="polite">{message()}</p>
        </Show>

        <Show when={order()}>
          {(current) => (
            <>
              <section class="panel">
                <header class="panel__head">
                  <h2 class="panel__title">
                    Estado: <span class={`pill pill--${current().status}`}>{STATUS_LABEL[current().status]}</span>
                  </h2>
                  <div class="actions">
                    <For each={next()}>
                      {(status) => (
                        <button class="ghost" onClick={() => void move(status)}>
                          Marcar {STATUS_LABEL[status]} <span aria-hidden="true">→</span>
                        </button>
                      )}
                    </For>
                  </div>
                </header>

                <div class="form-grid">
                  <div>
                    <p class="eyebrow">Cliente</p>
                    <p>{current().customer.name}</p>
                    <p class="caption">{current().customer.phone} · {current().customer.email || 'sin correo'}</p>
                    <p class="caption">
                      {current().customer.address?.line1} — {current().customer.city}
                      {addressRef(current())}
                    </p>
                  </div>
                  <div>
                    <p class="eyebrow">Entrega y pago</p>
                    <p class="caption">Método de envío: {current().shippingMethod}</p>
                    <p class="caption">Pago: {current().paymentMethod}</p>
                    <p class="caption">Creado: {dateTime(current().createdAt)}</p>
                  </div>
                </div>

                <table class="table" style="margin-top: var(--space-16)">
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col">Opciones</th>
                      <th scope="col" class="table__num">Cantidad</th>
                      <th scope="col" class="table__num">Precio</th>
                      <th scope="col" class="table__num">Subtotal</th>
                      <th scope="col">Devolver</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={current().items}>
                      {(item) => (
                        <tr>
                          <td>{item.title}</td>
                          <td>{optionLabel(item.options) || '—'}</td>
                          <td class="table__num">{item.qty}</td>
                          <td class="table__num">{bob(item.price)}</td>
                          <td class="table__num">{bob(item.price * item.qty)}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max={item.qty}
                              value={returnQty()[item.variantId] ?? 0}
                              onInput={(e) =>
                                setReturnQty((r) => ({
                                  ...r,
                                  [item.variantId]: Math.min(item.qty, Math.max(0, Number(e.currentTarget.value) || 0)),
                                }))
                              }
                              style="width: 72px"
                            />
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>

                <div class="checkout__totals" style="margin-top: var(--space-16); max-width: 320px">
                  <p class="checkout__line"><span>Subtotal</span><span>{bob(current().subtotal)}</span></p>
                  <p class="checkout__line"><span>Descuento</span><span>− {bob(current().discount)}</span></p>
                  <p class="checkout__line"><span>Envío</span><span>{bob(current().shipping)}</span></p>
                  <p class="checkout__line"><span>IVA</span><span>{bob(current().tax)}</span></p>
                  <p class="checkout__total"><span>Total</span><span>{bob(current().total)}</span></p>
                </div>
              </section>

              <section class="panel">
                <header class="panel__head"><h2 class="panel__title">Devolución</h2></header>
                <div class="form-grid">
                  <div class="field">
                    <label for="reason">Motivo</label>
                    <input id="reason" value={reason()} onInput={(e) => setReason(e.currentTarget.value)} />
                  </div>
                  <div class="field">
                    <label for="restock">Reponer stock</label>
                    <label class="caption" style="display:flex; gap: var(--space-8); align-items:center">
                      <input
                        id="restock"
                        type="checkbox"
                        checked={restock()}
                        onChange={(e) => setRestock(e.currentTarget.checked)}
                      />
                      Devuelve las unidades al inventario
                    </label>
                  </div>
                </div>
                <p class="caption">Reembolso calculado: {bob(refundTotal())}</p>
                <button class="ghost" style="margin-top: var(--space-12)" onClick={() => void submitReturn()}>
                  Registrar devolución <span aria-hidden="true">→</span>
                </button>

                <Show when={current().returns.length}>
                  <div style="margin-top: var(--space-16)">
                    <For each={current().returns}>
                      {(record) => (
                        <p class="caption">
                          {dateTime(record.at)} · {record.reason} · {bob(record.refund)}
                          {record.restocked ? ' · stock repuesto' : ''}
                        </p>
                      )}
                    </For>
                  </div>
                </Show>
              </section>

              <section class="panel">
                <header class="panel__head">
                  <h2 class="panel__title">Comprobante de pago</h2>
                </header>
                <Show
                  when={current().paymentProof}
                  fallback={
                    <div class="toolbar" style="margin:0">
                      <label class="sr-only" for="proof">Archivo del comprobante</label>
                      <input id="proof" value={proof()} onInput={(e) => setProof(e.currentTarget.value)} />
                      <button class="ghost" onClick={() => void attachProof()}>Adjuntar</button>
                    </div>
                  }
                >
                  <p class="caption">Adjunto: {current().paymentProof}</p>
                </Show>
              </section>

              <section class="panel">
                <header class="panel__head"><h2 class="panel__title">Notas internas</h2></header>
                <div class="toolbar">
                  <label class="sr-only" for="note">Nota</label>
                  <input
                    id="note"
                    value={note()}
                    placeholder="Ej. facturar con NIT"
                    onInput={(e) => setNote(e.currentTarget.value)}
                  />
                  <button class="ghost" onClick={() => void saveNote()}>Agregar nota</button>
                </div>
                <Show
                  when={current().internalNotes.length}
                  fallback={<p class="caption">Todavía no hay notas.</p>}
                >
                  <ul class="timeline">
                    <For each={current().internalNotes}>
                      {(item) => <li class="caption">{item}</li>}
                    </For>
                  </ul>
                </Show>
              </section>

              <section class="panel">
                <header class="panel__head"><h2 class="panel__title">Historial</h2></header>
                <div class="timeline">
                  <For each={current().events}>
                    {(event) => (
                      <p class="caption">
                        <strong>{event.type.toUpperCase()}</strong> — {event.message} · {dateTime(event.at)} · {event.actor}
                      </p>
                    )}
                  </For>
                </div>
              </section>
            </>
          )}
        </Show>
      </Show>
    </>
  );
}
