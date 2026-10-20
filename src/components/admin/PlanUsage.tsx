// Plan activo, uso real contra los límites y qué desbloquea el siguiente plan.

import { createSignal, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob } from '../../lib/format';
import { FEATURES, TIERS, can, limitFor, tierById, type FeatureId } from '../../lib/tiers';
import { hydrateSession, tier } from '../../lib/store';
import type { Tenant } from '../../lib/types';
import './admin.css';

const USAGE: { feature: FeatureId; label: string }[] = [
  { feature: 'products', label: 'Productos publicados' },
  { feature: 'locations', label: 'Sucursales' },
  { feature: 'roles', label: 'Usuarios' },
  { feature: 'automations', label: 'Automatizaciones' },
];

export default function PlanUsage(props: { tenant: Tenant }) {
  const [counts, setCounts] = createSignal<Record<string, number>>({});
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    hydrateSession();
    const api = await prepare();
    const [products, orders, automations] = await Promise.all([
      api.listProducts(props.tenant.id),
      api.listOrders(props.tenant.id),
      api.listAutomations(props.tenant.id),
    ]);
    setCounts({
      products: products.filter((p) => p.status === 'activo').length,
      locations: 1,
      roles: 1,
      automations: automations.length,
      orders: orders.length,
    });
    setLoading(false);
  });

  const current = () => tierById(tier());
  const nextPlan = () => TIERS[TIERS.findIndex((t) => t.id === tier()) + 1] ?? null;

  const unlocks = () => nextPlan()
    ? FEATURES.filter((f) => !can(tier(), f.id) && can(nextPlan()!.id, f.id))
    : [];

  const pct = (feature: FeatureId) => {
    const limit = limitFor(tier(), feature);
    if (!Number.isFinite(limit)) return 8;
    const used = counts()[feature] ?? 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  return (
    <>
      <header class="admin__head">
        <div>
          <p class="eyebrow">Suscripción</p>
          <h1 class="admin__title">Plan y uso</h1>
        </div>
        <p class="caption">
          {current().name} · Bs. {current().bob} / mes
        </p>
      </header>

      <section class="panel">
        <header class="panel__head">
          <h2 class="panel__title">Uso de este período</h2>
          <p class="caption">{loading() ? 'Midiendo' : 'Calculado sobre los datos de la cache'}</p>
        </header>
        <div class="usage">
          <For each={USAGE}>
            {(row) => (
              <div class="usage__row">
                <span style="min-width: 220px">{row.label}</span>
                <span class="usage__bar" role="img" aria-label={`${row.label}: uso ${pct(row.feature)} por ciento`}>
                  <span class="usage__fill" style={`width: ${pct(row.feature)}%`} />
                </span>
                <span style="min-width: 120px; text-align: right">
                  {counts()[row.feature] ?? 0}
                  {Number.isFinite(limitFor(tier(), row.feature)) ? ` / ${limitFor(tier(), row.feature)}` : ' / sin límite'}
                </span>
              </div>
            )}
          </For>
        </div>
      </section>

      <Show when={nextPlan()}>
        {(plan) => (
          <section class="panel">
            <header class="panel__head">
              <h2 class="panel__title">Qué desbloquea {plan().name}</h2>
              <p class="caption">Bs. {plan().bob} / mes</p>
            </header>
            <ul class="timeline">
              <For each={unlocks()}>
                {(feature) => <li class="caption">{feature.label}</li>}
              </For>
            </ul>
            <p style="margin-top: var(--s-16)">
              <a class="ghost" href="/precios/">
                Ver todos los planes <span aria-hidden="true">→</span>
              </a>
            </p>
          </section>
        )}
      </Show>

      <section class="panel">
        <header class="panel__head"><h2 class="panel__title">Facturación</h2></header>
        <p class="caption">
          En la demo la suscripción es simulada. En producción el cobro va por Merchant of Record,
          que emite la factura y resuelve los impuestos, más transferencia y QR para clientes
          bolivianos. El plan anual equivale a diez meses: {bob(current().annualBob)}.
        </p>
      </section>
    </>
  );
}
