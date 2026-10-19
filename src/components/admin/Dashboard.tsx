// Resumen del panel: métricas calculadas sobre los datos guardados.

import { createSignal, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob, relativeDay } from '../../lib/format';
import { STATUS_LABEL } from '../../lib/api/mock-orders';
import type { Order, Tenant, TenantStats } from '../../lib/types';
import './admin.css';

export default function Dashboard(props: { tenant: Tenant }) {
  const [stats, setStats] = createSignal<TenantStats | null>(null);
  const [recent, setRecent] = createSignal<Order[]>([]);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    const api = await prepare();
    const [metrics, orders] = await Promise.all([
      api.stats(props.tenant.id),
      api.listOrders(props.tenant.id),
    ]);
    setStats(metrics);
    setRecent(orders.slice(0, 5));
    setLoading(false);
  });

  const maxDay = () => Math.max(1, ...(stats()?.salesByDay.map((d) => d.total) ?? [1]));

  return (
    <>
      <header class="admin__head">
        <div>
          <p class="eyebrow">Panel</p>
          <h1 class="admin__title">Resumen de {props.tenant.name}</h1>
        </div>
        <p class="caption">
          {loading() ? 'Calculando métricas' : 'Datos de la cache local de este navegador'}
        </p>
      </header>

      <Show when={stats()}>
        {(s) => (
          <>
            <div class="metrics">
              <article class="metric">
                <p class="eyebrow">Ventas de hoy</p>
                <p class="metric__value">{bob(s().salesToday)}</p>
                <p class="caption">{s().ordersToday} pedidos</p>
              </article>
              <article class="metric">
                <p class="eyebrow">Ventas del período</p>
                <p class="metric__value">{bob(s().salesMonth)}</p>
                <p class="caption">{s().ordersMonth} pedidos</p>
              </article>
              <article class="metric">
                <p class="eyebrow">Ticket promedio</p>
                <p class="metric__value">{bob(s().avgTicket)}</p>
                <p class="caption">{s().customerCount} clientes</p>
              </article>
              <article class="metric">
                <p class="eyebrow">Pedidos en curso</p>
                <p class="metric__value">{s().pendingOrders}</p>
                <p class="caption">
                  {s().activeProductCount} de {s().productCount} productos activos
                </p>
              </article>
            </div>

            <section class="panel">
              <header class="panel__head">
                <h2 class="panel__title">Ventas de los últimos 14 días</h2>
                <p class="caption">Cada barra es un día</p>
              </header>
              <div class="spark" role="img" aria-label="Ventas diarias de los últimos 14 días">
                <For each={s().salesByDay}>
                  {(day) => (
                    <div
                      class="spark__bar"
                      data-empty={day.total === 0 ? 'true' : 'false'}
                      style={`height: ${Math.max(2, Math.round((day.total / maxDay()) * 100))}%`}
                      title={`${day.day}: ${bob(day.total)}`}
                    />
                  )}
                </For>
              </div>
            </section>

            <section class="panel">
              <header class="panel__head">
                <h2 class="panel__title">Stock bajo</h2>
                <p class="caption">{s().lowStock.length} variantes por reponer</p>
              </header>
              <Show
                when={s().lowStock.length}
                fallback={<p class="caption">Ninguna variante por debajo del umbral.</p>}
              >
                <table class="table">
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col">SKU</th>
                      <th scope="col" class="table__num">Disponible</th>
                      <th scope="col" class="table__num">Umbral</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={s().lowStock.slice(0, 8)}>
                      {(row) => (
                        <tr>
                          <td>{row.productTitle}</td>
                          <td>{row.sku}</td>
                          <td class="table__num">{row.qty}</td>
                          <td class="table__num">{row.lowStockAt}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </Show>
            </section>

            <section class="panel">
              <header class="panel__head">
                <h2 class="panel__title">Más vendidos</h2>
              </header>
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col" class="table__num">Unidades</th>
                    <th scope="col" class="table__num">Facturado</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={s().topProducts}>
                    {(row) => (
                      <tr>
                        <td>{row.title}</td>
                        <td class="table__num">{row.qty}</td>
                        <td class="table__num">{bob(row.total)}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </section>
          </>
        )}
      </Show>

      <section class="panel">
        <header class="panel__head">
          <h2 class="panel__title">Últimos pedidos</h2>
          <a class="link-button" href={`/admin/${props.tenant.slug}/pedidos/`}>Ver todos</a>
        </header>
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Cliente</th>
              <th scope="col">Estado</th>
              <th scope="col">Fecha</th>
              <th scope="col" class="table__num">Total</th>
            </tr>
          </thead>
          <tbody>
            <For each={recent()}>
              {(order) => (
                <tr>
                  <td>
                    <a class="link-button" href={`/admin/${props.tenant.slug}/pedidos/detalle/?id=${order.id}`}>
                      {order.code}
                    </a>
                  </td>
                  <td>{order.customer.name}</td>
                  <td><span class={`pill pill--${order.status}`}>{STATUS_LABEL[order.status]}</span></td>
                  <td>{relativeDay(order.createdAt)}</td>
                  <td class="table__num">{bob(order.total)}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </section>
    </>
  );
}
