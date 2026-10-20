// Entrada simulada al panel. Sin sesión se muestra un formulario que deja
// elegir rol; con sesión, una barra con el rol activo y la opción de cambiarlo.
// Es una demostración de permisos, no un control de seguridad.

import { createSignal, onMount, For, Show } from 'solid-js';
import {
  ROLE_HINT,
  ROLE_LABEL,
  ROLES,
  hydrateAuth,
  login,
  logout,
  session,
  type Role,
} from '../../lib/session';
import './admin.css';

export default function AdminSession(props: { tenantSlug: string; tenantName: string }) {
  const [ready, setReady] = createSignal(false);
  const [name, setName] = createSignal('');
  const [role, setRole] = createSignal<Role>('propietario');

  onMount(() => {
    hydrateAuth(props.tenantSlug);
    setReady(true);
  });

  const enter = (event: Event) => {
    event.preventDefault();
    login(props.tenantSlug, name(), role());
  };

  return (
    <>
      <Show when={ready() && !session()}>
        <div class="auth" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <form class="auth__card" onSubmit={enter}>
            <p class="eyebrow">Acceso de demostración</p>
            <h2 class="auth__title" id="auth-title">Entrar al panel de {props.tenantName}</h2>
            <p class="auth__text">
              Elegí un rol para ver cómo cambia el panel. No hay contraseña: es una
              simulación para recorrer la demo.
            </p>

            <div class="field">
              <label for="auth-name">Tu nombre</label>
              <input
                id="auth-name"
                value={name()}
                placeholder="Ej. Ana Quiroga"
                onInput={(e) => setName(e.currentTarget.value)}
              />
            </div>

            <div class="field">
              <label for="auth-role">Rol</label>
              <select id="auth-role" value={role()} onChange={(e) => setRole(e.currentTarget.value as Role)}>
                <For each={ROLES}>{(r) => <option value={r}>{ROLE_LABEL[r]}</option>}</For>
              </select>
              <p class="caption">{ROLE_HINT[role()]}</p>
            </div>

            <div class="auth__actions">
              <button class="ghost ghost--solid" type="submit">
                Entrar <span aria-hidden="true">→</span>
              </button>
              <a class="ghost" href={`/t/${props.tenantSlug}/`}>Volver a la tienda</a>
            </div>
          </form>
        </div>
      </Show>

      <Show when={session()}>
        {(current) => (
          <div class="session">
            <p class="session__who">
              <span class="session__dot" aria-hidden="true" />
              {current().name}
              <span class="caption"> · {ROLE_LABEL[current().role]}</span>
            </p>
            <div class="session__actions">
              <label class="sr-only" for="switch-role">Cambiar rol</label>
              <select
                id="switch-role"
                value={current().role}
                onChange={(e) => login(props.tenantSlug, current().name, e.currentTarget.value as Role)}
              >
                <For each={ROLES}>{(r) => <option value={r}>{ROLE_LABEL[r]}</option>}</For>
              </select>
              <button class="link-button" onClick={() => logout(props.tenantSlug)}>Salir</button>
            </div>
          </div>
        )}
      </Show>
    </>
  );
}
