import { createSignal, For, Show, onMount, onCleanup } from 'solid-js';
import {
  TIERS,
  FEATURES,
  GROUPS,
  GROUP_LABEL,
  can,
  limitFor,
  tierById,
  minTierFor,
  type TierId,
  type FeatureId,
} from '../lib/tiers';
import '../styles/tier.css';

function readStoredTier(): TierId | null {
  if (typeof window === 'undefined') return null;
  const fromUrl = new URLSearchParams(window.location.search).get('tier');
  if (fromUrl && TIERS.some((t) => t.id === fromUrl)) return fromUrl as TierId;
  const stored = window.localStorage.getItem('stukostore.tier');
  if (stored && TIERS.some((t) => t.id === stored)) return stored as TierId;
  return null;
}

export default function TierDemo(props: { variant?: 'compact' | 'full' }) {
  const variant = props.variant ?? 'compact';
  // The island is prerendered at build time with the default tier. Solid
  // hydration reuses that markup and does NOT re-run the component body, so the
  // stored tier must be applied after mount — otherwise a reload always shows
  // the default again.
  const [tier, setTier] = createSignal<TierId>('tienda');
  const [open, setOpen] = createSignal(false);
  const [announce, setAnnounce] = createSignal('');

  onMount(() => {
    const stored = readStoredTier();
    if (stored) setTier(stored);
  });

  const current = () => tierById(tier());

  const apply = (id: TierId) => {
    setTier(id);
    setAnnounce(`Plan ${tierById(id).name} seleccionado. ${tierById(id).pitch}`);
    try {
      window.localStorage.setItem('stukostore.tier', id);
      const url = new URL(window.location.href);
      url.searchParams.set('tier', id);
      window.history.replaceState({}, '', url);
    } catch {
      /* storage disabled: the demo still works for this session */
    }
  };

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });

  const cellState = (feature: FeatureId) => {
    if (!can(tier(), feature)) return 'locked';
    const limit = limitFor(tier(), feature);
    return Number.isFinite(limit) ? 'limited' : 'included';
  };

  const cellText = (feature: FeatureId) => {
    const state = cellState(feature);
    if (state === 'locked') return '—';
    if (state === 'included') return 'Sí';
    return `Hasta ${limitFor(tier(), feature)}`;
  };

  const groupSummary = (group: (typeof GROUPS)[number]) => {
    const rows = FEATURES.filter((f) => f.group === group);
    const included = rows.filter((f) => can(tier(), f.id)).length;
    const nextLocked = rows.find((f) => !can(tier(), f.id));
    return { rows, included, nextLocked };
  };

  return (
    <div class="tierdemo">
      <Show
        when={variant === 'full'}
        fallback={
          <table class="matrix matrix--compact">
            <caption class="sr-only">
              Resumen de funciones incluidas por plan
            </caption>
            <thead>
              <tr>
                <th scope="col">Área</th>
                <th scope="col">Incluido en {current().name}</th>
                <th scope="col">Bloqueado hasta</th>
              </tr>
            </thead>
            <tbody>
              <For each={GROUPS}>
                {(group) => {
                  const s = () => groupSummary(group);
                  return (
                    <tr>
                      <th scope="row">{GROUP_LABEL[group]}</th>
                      <td>
                        <span class="matrix__count">
                          {s().included} de {s().rows.length}
                        </span>
                      </td>
                      <td>
                        <Show
                          when={s().nextLocked}
                          fallback={<span class="caption">Todo incluido</span>}
                        >
                          <span class="matrix__locked">
                            {s().nextLocked!.label} — {tierById(minTierFor(s().nextLocked!.id)).name}
                          </span>
                        </Show>
                      </td>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          </table>
        }
      >
        <table class="matrix">
          <caption class="sr-only">Comparación completa de planes y funciones</caption>
          <thead>
            <tr>
              <th scope="col">Función</th>
              <For each={TIERS}>
                {(t) => (
                  <th scope="col" classList={{ 'is-current': t.id === tier() }}>
                    {t.name}
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <For each={GROUPS}>
            {(group) => (
              <tbody>
                <tr class="matrix__group">
                  <th scope="colgroup" colspan={TIERS.length + 1}>
                    {GROUP_LABEL[group]}
                  </th>
                </tr>
                <For each={FEATURES.filter((f) => f.group === group)}>
                  {(f) => (
                    <tr classList={{ 'is-locked': !can(tier(), f.id) }}>
                      <th scope="row">
                        {f.label}
                        <Show when={f.note}>
                          <span class="matrix__note"> {f.note}</span>
                        </Show>
                      </th>
                      <For each={TIERS}>
                        {(t) => (
                          <td classList={{ 'is-current': t.id === tier() }}>
                            {can(t.id, f.id)
                              ? Number.isFinite(limitFor(t.id, f.id))
                                ? `Hasta ${limitFor(t.id, f.id)}`
                                : 'Sí'
                              : '—'}
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            )}
          </For>
        </table>
      </Show>

      <p class="tierdemo__hint caption">
        Cambia el plan abajo y mira cómo se reconfigura la tienda. Lo bloqueado se
        muestra atenuado: eso es exactamente lo que se desbloquea al subir de plan.
      </p>

      <div class="dock" data-open={open()}>
        <div class="dock__bar">
          <span class="eyebrow dock__label">Estás viendo</span>
          <strong class="dock__current">{current().name}</strong>
          <span class="caption dock__price">
            Bs. {current().bob} / mes
          </span>
          <button
            class="ghost dock__toggle"
            aria-expanded={open()}
            aria-controls="tier-panel"
            onClick={() => setOpen(!open())}
          >
            {open() ? 'CERRAR' : 'CAMBIAR TIER'} <span aria-hidden="true">→</span>
          </button>
        </div>

        <Show when={open()}>
          <div class="dock__panel" id="tier-panel">
            <For each={TIERS}>
              {(t) => (
                <button
                  class="dock__card"
                  aria-pressed={t.id === tier()}
                  onClick={() => apply(t.id)}
                >
                  <span class="eyebrow">{t.name}</span>
                  <span class="dock__amount">
                    Bs. {t.bob}
                    <span class="caption"> / mes</span>
                  </span>
                  <span class="dock__pitch">{t.pitch}</span>
                  <span class="caption dock__who">{t.forWho}</span>
                </button>
              )}
            </For>
          </div>
        </Show>

        <p class="sr-only" aria-live="polite">
          {announce()}
        </p>
      </div>
    </div>
  );
}
