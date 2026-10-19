// Lista de pedidos con filtro por estado y búsqueda por cliente o código.

import { createSignal, createMemo, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob, dateTime } from '../../lib/format';
import { STATUS_LABEL } from '../../lib/api/mock-orders';
import { hydrateSession } from '../../lib/store';
import type { Order, OrderStatus, Tenant } from '../../lib/types';
import './admin.css';

const STATUSES: (OrderStatus | 'todos')[] = [
  'todos', 'pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'devuelto', 'cancelado',
];

export default function OrderTable(props: { tenant: Tenant }) {
  const [orders, setOrders] = createSignal<Order[]>([]);
  const [filter, setFilter] = createSignal<OrderStatus | 'todos'>('todos');
  const [query, setQuery] = createSignal('');
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    hydrateSession();
    const api = await prepare();
    setOrders(await api.listOrders(props.tenant.id));
    setLoading(false);
  });

  const visible = createMemo(() => {
    const q = query().trim().toLowerCase();
    return orders().filter((o) => {
      if (filter() !== 'todos' && o.status !== filter()) return false;
      if (!q) return true;
      return `${o.code} ${o.customer.name} ${o.customer.city}`.toLowerCase().includes(q);
    });
  });

  const totals = createMemo(() => ({
    count: visible().length,
    amount: visible().filter((o) => o.status !== 'cancelado').reduce((s, o) => s + o.total, 0),
  }));

  return (
    <>
      <header class="admin__head">
        <div>
          <p class="eyebrow">Ventas</p>
          <h1 class="admin__title">Pedidos</h1>
        </div>
        <p class="caption">
          {totals().count} pedidos · {bob(totals().amount)} facturado
        </p>
      </header>

      <div class="toolbar">
        <label class="sr-only" for="q">Buscar pedido</label>
        <input
          id="q"
          placeholder="Código, cliente o ciudad"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
        />
        <label class="sr-only" for="status">Estado</label>
        <select id="status" value={filter()} onChange={(e) => setFilter(e.currentTarget.value as OrderStatus | 'todos')}>
          <For each={STATUSES}>
            {(status) => (
              <option value={status}>{status === 'todos' ? 'Todos los estados' : STATUS_LABEL[status]}</option>
            )}
          </For>
        </select>
      </div>

      <Show when={!loading()} fallback={<p class="caption">Cargando pedidos…</p>}>
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Fecha</th>
              <th scope="col">Cliente</th>
              <th scope="col">Ciudad</th>
              <th scope="col">Pago</th>
              <th scope="col">Estado</th>
              <th scope="col" class="table__num">Total</th>
            </tr>
          </thead>
          <tbody>
            <For each={visible()}>
              {(order) => (
                <tr>
                  <td>
                    <a class="link-button" href={`/admin/${props.tenant.slug}/pedidos/detalle/?id=${order.id}`}>
                      {order.code}
                    </a>
                  </td>
                  <td>{dateTime(order.createdAt)}</td>
                  <td>{order.customer.name}</td>
                  <td>{order.customer.city}</td>
                  <td><span class="pill">{order.paymentMethod}</span></td>
                  <td><span class={`pill pill--${order.status}`}>{STATUS_LABEL[order.status]}</span></td>
                  <td class="table__num">{bob(order.total)}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <Show when={!visible().length}>
          <p class="empty">No hay pedidos con ese filtro.</p>
        </Show>
      </Show>
    </>
  );
}
