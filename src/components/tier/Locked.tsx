// Estado bloqueado por plan: nunca oculta la función del todo, muestra qué se
// desbloquea y en qué plan. Es el motor de upsell de la demo.

import { Show } from 'solid-js';
import { FEATURE_BY_ID, minTierFor, tierById, type FeatureId } from '../../lib/tiers';

interface Props {
  feature: FeatureId;
  compact?: boolean;
}

export default function Locked(props: Props) {
  const label = FEATURE_BY_ID[props.feature].label;
  const note = FEATURE_BY_ID[props.feature].note;
  const plan = tierById(minTierFor(props.feature));

  return (
    <div class="locked" data-compact={props.compact ? 'true' : 'false'}>
      <p class="eyebrow">Bloqueado</p>
      <p class="locked__title">{label}</p>
      <p class="locked__plan">
        Disponible desde el plan <strong>{plan.name}</strong> · Bs. {plan.bob} / mes
      </p>
      <Show when={note}>
        <p class="caption">{note}</p>
      </Show>
      <a class="ghost" href="/precios/">
        Ver planes <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}
