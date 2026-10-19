// Marca "Hecho con StukoStore". El plan ESCAPARATE siempre la lleva; desde
// TIENDA se puede quitar. La barra de plan la muestra u oculta en vivo.

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
      <span class="caption credit">
        Hecho con <a href="/">StukoStore</a>
        {forced() ? ' — plan ESCAPARATE' : ''}
      </span>
    </Show>
  );
}
