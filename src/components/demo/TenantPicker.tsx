// Selector de tienda demo. Es el primer punto donde la capa de datos se
// ejercita de verdad: siembra IndexedDB y muestra los conteos reales.

import { createSignal, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob, pluralize } from '../../lib/format';
import type { Tenant } from '../../lib/types';
import '../../styles/tier.css';
import './tenant-picker.css';

interface Row {
  tenant: Tenant;
  products: number;
  orders: number;
  customers: number;
  sales: number;
}

export default function TenantPicker() {
  const [rows, setRows] = createSignal<Row[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [resetting, setResetting] = createSignal(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const api = await prepare();
      const tenants = await api.listTenants();
      const built: Row[] = [];
      for (const tenant of tenants) {
        const [products, orders, customers] = await Promise.all([
          api.listProducts(tenant.id),
          api.listOrders(tenant.id),
          api.listCustomers(tenant.id),
        ]);
        built.push({
          tenant,
          products: products.length,
          orders: orders.length,
          customers: customers.length,
          sales: orders
            .filter((o) => o.status !== 'cancelado')
            .reduce((sum, o) => sum + o.total, 0),
        });
      }
      setRows(built);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la demo');
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    void load();
  });

  const reset = async () => {
    setResetting(true);
    const api = await prepare();
    await api.resetDemo();
    await load();
    setResetting(false);
  };

  return (
    <section class="picker">
      <header class="picker__head">
        <div>
          <p class="eyebrow">Datos de la demo</p>
          <p class="picker__status" aria-live="polite">
            {loading()
              ? 'Cargando tiendas desde la cache local'
              : `${rows().length} tiendas sembradas en este navegador`}
          </p>
        </div>
        <button class="ghost" onClick={() => void reset()} disabled={resetting()}>
          {resetting() ? 'Reiniciando' : 'Reiniciar demo'}
        </button>
      </header>

      <Show when={error()}>
        <p class="picker__error" role="alert">{error()}</p>
      </Show>

      <Show when={loading()}>
        <div class="picker__skeleton" aria-hidden="true">
          <For each={[0, 1, 2]}>{() => <div class="picker__ghost" />}</For>
        </div>
      </Show>

      <div class="picker__grid">
        <For each={rows()}>
          {(row) => (
            <article class="picker__card">
              <p class="eyebrow">{row.tenant.plan}</p>
              <h3 class="picker__name">
                <span class="mono" aria-hidden="true">{row.tenant.monogram}</span>
                {row.tenant.name}
              </h3>
              <p class="picker__tagline">{row.tenant.tagline}</p>
              <dl class="picker__stats">
                <div>
                  <dt>Productos</dt>
                  <dd>{row.products}</dd>
                </div>
                <div>
                  <dt>Pedidos</dt>
                  <dd>{row.orders}</dd>
                </div>
                <div>
                  <dt>Clientes</dt>
                  <dd>{row.customers}</dd>
                </div>
                <div>
                  <dt>Vendido</dt>
                  <dd>{bob(row.sales)}</dd>
                </div>
              </dl>
              <p class="caption">Atiende desde {row.tenant.city}</p>
              <div class="picker__actions">
                <a class="ghost" href={`/t/${row.tenant.slug}/`}>
                  Abrir tienda <span aria-hidden="true">→</span>
                </a>
                <a class="ghost" href={`/admin/${row.tenant.slug}/`}>
                  Abrir panel <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          )}
        </For>
      </div>
    </section>
  );
}
