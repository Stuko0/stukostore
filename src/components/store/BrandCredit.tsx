// Crédito de marca del pie. ESCAPARATE siempre lo lleva; desde TIENDA la
// tienda puede quitarlo. Enlaza al portafolio, no al producto.

import { createSignal, onMount, Show } from 'solid-js';
import { hydrateSession, tier } from '../../lib/store';

export default function BrandCredit(props: { tenantSlug: string; footerBrand: boolean }) {
  const [ready, setReady] = createSignal(false);
  onMount(() => {
    hydrateSession();
    setReady(true);
  });

  const forced = () => tier() === 'escaparate';
  const visible = () => !ready() || forced() || props.footerBrand;

  return (
    <Show when={visible()}>
      <span class="credit">
        Hecho por{' '}
        <a href="https://stuko.dev" target="_blank" rel="noopener noreferrer">Stuko</a>
        {forced() ? ' — plan ESCAPARATE' : ''}
      </span>
    </Show>
  );
}
