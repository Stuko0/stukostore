// Barra inferior colapsable: cambia el plan activo en toda la aplicación.
// Presente en el storefront y en el panel; en las páginas de venta se usa la
// matriz completa.

import { createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { TIERS, tierById } from '../../lib/tiers';
import { applyTier, hydrateSession, tier } from '../../lib/store';
import './tier-dock.css';

export default function TierDock() {
  const [open, setOpen] = createSignal(false);
  const [announce, setAnnounce] = createSignal('');

  onMount(() => {
    hydrateSession();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });

  const choose = (id: (typeof TIERS)[number]['id']) => {
    applyTier(id, { syncUrl: true });
    setAnnounce(`Plan ${tierById(id).name} activo. ${tierById(id).pitch}`);
  };

  return (
    <div class="dock" data-open={open()}>
      <div class="dock__bar">
        <span class="eyebrow dock__label">Plan de la demo</span>
        <strong class="dock__current">{tierById(tier()).name}</strong>
        <span class="caption dock__price">Bs. {tierById(tier()).bob} / mes</span>
        <button
          class="ghost dock__toggle"
          aria-expanded={open()}
          aria-controls="tier-panel"
          onClick={() => setOpen(!open())}
        >
          {open() ? 'Cerrar' : 'Cambiar plan'} <span aria-hidden="true">→</span>
        </button>
      </div>

      <Show when={open()}>
        <div class="dock__panel" id="tier-panel">
          <For each={TIERS}>
            {(t) => (
              <button class="dock__card" aria-pressed={t.id === tier()} onClick={() => choose(t.id)}>
                <span class="eyebrow">{t.name}</span>
                <span class="dock__amount">
                  Bs. {t.bob}
                  <span class="caption"> / mes</span>
                </span>
                <span class="dock__pitch">{t.pitch}</span>
              </button>
            )}
          </For>
        </div>
      </Show>

      <p class="sr-only" aria-live="polite">{announce()}</p>
    </div>
  );
}
