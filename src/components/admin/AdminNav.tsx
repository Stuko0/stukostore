// Navegación del panel. Los módulos que el plan activo no incluye aparecen
// atenuados con el plan que los habilita: el prospecto ve qué se gana al subir.

import { For, Show, onMount } from 'solid-js';
import { can, type FeatureId } from '../../lib/tiers';
import { hydrateSession, tier } from '../../lib/store';
import { tierById, minTierFor } from '../../lib/tiers';
import './admin.css';

interface Item {
  section: string;
  label: string;
  href: (slug: string) => string;
  feature?: FeatureId;
}

const ITEMS: Item[] = [
  { section: 'resumen', label: 'Resumen', href: (s) => `/admin/${s}/` },
  { section: 'pedidos', label: 'Pedidos', href: (s) => `/admin/${s}/pedidos/` },
  { section: 'productos', label: 'Productos', href: (s) => `/admin/${s}/productos/` },
  { section: 'inventario', label: 'Inventario', href: (s) => `/admin/${s}/inventario/`, feature: 'inventory' },
  { section: 'colecciones', label: 'Colecciones', href: (s) => `/admin/${s}/colecciones/`, feature: 'collections' },
  { section: 'tema', label: 'Tema', href: (s) => `/admin/${s}/tema/`, feature: 'theme' },
  { section: 'clientes', label: 'Clientes', href: (s) => `/admin/${s}/clientes/`, feature: 'customers' },
  { section: 'automatizaciones', label: 'Automatizaciones', href: (s) => `/admin/${s}/automatizaciones/`, feature: 'automations' },
  { section: 'plan', label: 'Plan y uso', href: (s) => `/admin/${s}/plan/` },
];

export default function AdminNav(props: { tenantSlug: string; current: string }) {
  onMount(() => hydrateSession());

  return (
    <nav class="admin__nav" aria-label="Secciones del panel">
      <ul>
        <For each={ITEMS}>
          {(item) => {
            const blocked = () => item.feature ? !can(tier(), item.feature) : false;
            return (
              <li>
                <a
                  class="admin__link"
                  classList={{ 'admin__link--locked': blocked() }}
                  href={item.href(props.tenantSlug)}
                  aria-current={item.section === props.current ? 'page' : undefined}
                >
                  {item.label}
                  <Show when={blocked()}>
                    <span class="admin__flag">{tierById(minTierFor(item.feature!)).name}</span>
                  </Show>
                </a>
              </li>
            );
          }}
        </For>
      </ul>
    </nav>
  );
}
