// Puerta de plan: renderiza el contenido si el plan activo lo incluye y, si
// no, una tarjeta de bloqueo con el plan mínimo. Un solo lugar decide.

import { Show, type JSX } from 'solid-js';
import { tier } from '../../lib/store';
import { can, FEATURE_BY_ID, minTierFor, tierById, type FeatureId } from '../../lib/tiers';
import Locked from './Locked';

interface Props {
  feature: FeatureId;
  children: JSX.Element;
  /** Modo suave: muestra el contenido atenuado con la etiqueta, en lugar de ocultarlo. */
  soft?: boolean;
}

export default function TierGate(props: Props) {
  const allowed = () => can(tier(), props.feature);
  const label = FEATURE_BY_ID[props.feature].label;
  const needs = () => tierById(minTierFor(props.feature)).name;

  return (
    <Show
      when={allowed()}
      fallback={
        props.soft ? (
          <div class="gate gate--soft" aria-disabled="true">
            <div class="gate__body">{props.children}</div>
            <p class="gate__flag eyebrow">{label} · bloqueado en {needs()}</p>
          </div>
        ) : (
          <Locked feature={props.feature} />
        )
      }
    >
      {props.children}
    </Show>
  );
}
