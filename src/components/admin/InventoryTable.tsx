// Inventario: stock por variante y ubicación, ajustes con motivo y movimientos.

import { createSignal, createMemo, onMount, For, Show } from 'solid-js';
import { prepare, listLocations } from '../../lib/api/mock';
import { dateTime } from '../../lib/format';
import { hydrateSession } from '../../lib/store';
import { canDo, hydrateAuth } from '../../lib/session';
import type { InventoryLevel, InventoryMovement, Location, MovementReason, Product, Tenant } from '../../lib/types';
import TierGate from '../tier/TierGate';
import './admin.css';

const REASONS: { value: MovementReason; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'perdida', label: 'Pérdida' },
  { value: 'transferencia', label: 'Transferencia' },
];

export default function InventoryTable(props: { tenant: Tenant }) {
  const [levels, setLevels] = createSignal<InventoryLevel[]>([]);
  const [products, setProducts] = createSignal<Product[]>([]);
  const [locations, setLocations] = createSignal<Location[]>([]);
  const [movements, setMovements] = createSignal<InventoryMovement[]>([]);
  const [reason, setReason] = createSignal<MovementReason>('entrada');
  const [qty, setQty] = createSignal(1);
  const [note, setNote] = createSignal('Reposición de mercadería');
  const [message, setMessage] = createSignal('');
  const [loading, setLoading] = createSignal(true);
  const writable = createMemo(() => canDo('inventory:write'));

  const load = async () => {
    const api = await prepare();
    const [lv, pr, mv] = await Promise.all([
      api.listInventory(props.tenant.id),
      api.listProducts(props.tenant.id),
      api.listMovements(props.tenant.id),
    ]);
    setLevels(lv);
    setProducts(pr);
    setMovements(mv.slice(0, 12));
    setLoading(false);
  };

  onMount(async () => {
    hydrateSession();
    hydrateAuth(props.tenant.slug);
    setLocations(await listLocations(props.tenant.id));
    await load();
  });

  const label = (variantId: string) => {
    for (const product of products()) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant) return { title: product.title, sku: variant.sku };
    }
    return { title: 'Producto', sku: variantId };
  };

  const locationName = (id: string) => locations().find((l) => l.id === id)?.name ?? id;

  const adjust = async (level: InventoryLevel, delta: number) => {
    const api = await prepare();
    await api.adjustStock({
      tenantId: props.tenant.id,
      variantId: level.variantId,
      locationId: level.locationId,
      qty: delta,
      reason: reason(),
      note: note(),
      actor: 'panel',
    });
    await load();
    setMessage(`Movimiento registrado: ${delta > 0 ? '+' : ''}${delta} en ${locationName(level.locationId)}.`);
  };

  const applyBulk = async (level: InventoryLevel) => {
    await adjust(level, qty());
  };

  return (
    <TierGate feature="inventory">
      <header class="admin__head">
        <div>
          <p class="eyebrow">Operación</p>
          <h1 class="admin__title">Inventario</h1>
        </div>
        <p class="caption">{levels().length} niveles de stock en {locations().length} ubicaciones</p>
      </header>

      <Show when={message()}>
        <p class="notice" aria-live="polite">{message()}</p>
      </Show>

      <div class="toolbar">
        <label class="sr-only" for="reason">Motivo del movimiento</label>
        <select id="reason" value={reason()} onChange={(e) => setReason(e.currentTarget.value as MovementReason)}>
          <For each={REASONS}>{(r) => <option value={r.value}>{r.label}</option>}</For>
        </select>
        <label class="sr-only" for="qty">Cantidad</label>
        <input id="qty" type="number" value={qty()} onInput={(e) => setQty(Number(e.currentTarget.value) || 1)} />
        <label class="sr-only" for="note">Nota</label>
        <input id="note" value={note()} onInput={(e) => setNote(e.currentTarget.value)} />
      </div>

      <Show when={!loading()} fallback={<p class="caption">Cargando inventario…</p>}>
        <section class="panel">
          <header class="panel__head">
            <h2 class="panel__title">Stock por ubicación</h2>
            <p class="caption">El signo del movimiento se aplica con el botón</p>
          </header>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">SKU</th>
                <th scope="col">Ubicación</th>
                <th scope="col" class="table__num">Disponible</th>
                <th scope="col" class="table__num">Umbral</th>
                <th scope="col">Ajuste</th>
              </tr>
            </thead>
            <tbody>
              <For each={levels().slice(0, 40)}>
                {(level) => (
                  <tr>
                    <td>{label(level.variantId).title}</td>
                    <td>{label(level.variantId).sku}</td>
                    <td>{locationName(level.locationId)}</td>
                    <td class="table__num">
                      {level.qty}
                      <Show when={level.qty <= level.lowStockAt}>
                        <span class="pill pill--devuelto"> bajo</span>
                      </Show>
                    </td>
                    <td class="table__num">{level.lowStockAt}</td>
                    <td>
                      <div class="actions">
                        <Show when={writable()} fallback={<span class="caption">solo lectura</span>}>
                          <button class="link-button" onClick={() => void applyBulk(level)}>
                            +{qty()}
                          </button>
                          <button class="link-button" onClick={() => void adjust(level, -Math.abs(qty()))}>
                            −{Math.abs(qty())}
                          </button>
                        </Show>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </section>

        <section class="panel">
          <header class="panel__head">
            <h2 class="panel__title">Últimos movimientos</h2>
          </header>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Producto</th>
                <th scope="col">Motivo</th>
                <th scope="col" class="table__num">Cantidad</th>
                <th scope="col">Nota</th>
                <th scope="col">Autor</th>
              </tr>
            </thead>
            <tbody>
              <For each={movements()}>
                {(movement) => (
                  <tr>
                    <td>{dateTime(movement.at)}</td>
                    <td>{label(movement.variantId).title}</td>
                    <td><span class="pill">{movement.reason}</span></td>
                    <td class="table__num">{movement.qty > 0 ? `+${movement.qty}` : movement.qty}</td>
                    <td>{movement.note}</td>
                    <td>{movement.actor}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </section>
      </Show>
    </TierGate>
  );
}
