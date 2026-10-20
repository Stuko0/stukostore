// Clientes, colecciones y automatizaciones: listas compactas del panel.

import { createSignal, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob, shortDate } from '../../lib/format';
import { hydrateSession } from '../../lib/store';
import type { Automation, Collection, Customer, Product, Tenant } from '../../lib/types';
import TierGate from '../tier/TierGate';
import Locked from '../tier/Locked';
import './admin.css';

type Mode = 'clientes' | 'colecciones' | 'automatizaciones';

export default function AdminLists(props: { tenant: Tenant; mode: Mode }) {
  const [customers, setCustomers] = createSignal<Customer[]>([]);
  const [collections, setCollections] = createSignal<Collection[]>([]);
  const [automations, setAutomations] = createSignal<Automation[]>([]);
  const [products, setProducts] = createSignal<Product[]>([]);
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    hydrateSession();
    const api = await prepare();
    const [cu, co, au, pr] = await Promise.all([
      api.listCustomers(props.tenant.id),
      api.listCollections(props.tenant.id),
      api.listAutomations(props.tenant.id),
      api.listProducts(props.tenant.id),
    ]);
    setCustomers(cu);
    setCollections(co);
    setAutomations(au);
    setProducts(pr);
    setLoading(false);
  });

  const toggle = async (automation: Automation) => {
    const api = await prepare();
    const next = await api.toggleAutomation(automation.id);
    setAutomations((list) => list.map((a) => (a.id === next.id ? next : a)));
  };

  const collectionCount = (collectionId: string) =>
    products().filter((p) => p.collectionIds.includes(collectionId)).length;

  const title = {
    clientes: 'Clientes',
    colecciones: 'Colecciones',
    automatizaciones: 'Automatizaciones',
  }[props.mode];

  const eyebrow = {
    clientes: 'Ventas',
    colecciones: 'Catálogo',
    automatizaciones: 'Operación',
  }[props.mode];

  return (
    <TierGate feature={props.mode === 'clientes' ? 'customers' : props.mode === 'colecciones' ? 'collections' : 'automations'}>
      <header class="admin__head">
        <div>
          <p class="eyebrow">{eyebrow}</p>
          <h1 class="admin__title">{title}</h1>
        </div>
        <p class="caption">{loading() ? 'Cargando' : `${props.tenant.name}`}</p>
      </header>

      <Show when={!loading()} fallback={<p class="caption">Cargando datos…</p>}>
        <Show when={props.mode === 'clientes'}>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Contacto</th>
                <th scope="col">Ciudad</th>
                <th scope="col">Etiquetas</th>
                <th scope="col">Desde</th>
              </tr>
            </thead>
            <tbody>
              <For each={customers()}>
                {(customer) => (
                  <tr>
                    <td>{customer.name}</td>
                    <td>
                      {customer.phone}
                      <Show when={customer.email}>
                        <span class="caption"> · {customer.email}</span>
                      </Show>
                    </td>
                    <td>{customer.city}</td>
                    <td>
                      <For each={customer.tags}>{(tag) => <span class="pill">{tag}</span>}</For>
                    </td>
                    <td>{shortDate(customer.createdAt)}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>

        <Show when={props.mode === 'colecciones'}>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Colección</th>
                <th scope="col">Dirección</th>
                <th scope="col" class="table__num">Productos</th>
                <th scope="col">Tipo</th>
              </tr>
            </thead>
            <tbody>
              <For each={collections()}>
                {(collection) => (
                  <tr>
                    <td>{collection.title}</td>
                    <td class="caption">/c/{collection.slug}</td>
                    <td class="table__num">{collectionCount(collection.id)}</td>
                    <td><span class="pill">{collection.automatic ? 'automática' : 'manual'}</span></td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>

        <Show when={props.mode === 'automatizaciones'}>
          <Show
            when={automations().length}
            fallback={<Locked feature="automations" />}
          >
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Regla</th>
                  <th scope="col">Cuando</th>
                  <th scope="col">Acción</th>
                  <th scope="col" class="table__num">Ejecuciones</th>
                  <th scope="col">Estado</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                <For each={automations()}>
                  {(automation) => (
                    <tr>
                      <td>{automation.name}</td>
                      <td class="caption">
                        {automation.trigger}
                        <Show when={automation.condition}>
                          <span> · {automation.condition}</span>
                        </Show>
                      </td>
                      <td class="caption">{automation.action}</td>
                      <td class="table__num">{automation.runs.length}</td>
                      <td>
                        <span class={`pill ${automation.enabled ? 'pill--activo' : 'pill--archivado'}`}>
                          {automation.enabled ? 'activa' : 'pausada'}
                        </span>
                      </td>
                      <td>
                        <button class="link-button" onClick={() => void toggle(automation)}>
                          {automation.enabled ? 'Pausar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
            <p class="caption" style="margin-top: var(--s-12)">
              Plantilla de la primera regla: “{automations()[0]?.template}”
            </p>
          </Show>
        </Show>

        <Show when={props.mode === 'clientes'}>
          <p class="caption" style="margin-top: var(--s-12)">
            {customers().length} clientes registrados · el historial de compras se calcula desde los pedidos.
          </p>
        </Show>
      </Show>
    </TierGate>
  );
}
