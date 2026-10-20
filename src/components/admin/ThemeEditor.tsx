// Editor de tema en vivo. Cambia colores, radio y caja de titulares, valida
// contraste AA antes de guardar y muestra una vista previa inmediata.

import { createSignal, createMemo, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { canDo, hydrateAuth } from '../../lib/session';
import { prepare as apiReady } from '../../lib/api/mock';
import type { Tenant, TenantTheme } from '../../lib/types';
import '../admin/admin.css';
import './theme-editor.css';

const PRESETS: { id: string; name: string; theme: Partial<TenantTheme> }[] = [
  { id: 'claro', name: 'Claro', theme: { barBg: '#0b0b0b', barFg: '#ffffff', accent: '#b21820', surface: '#ffffff', radius: 14, headingCase: 'uppercase' } },
  { id: 'calido', name: 'Cálido', theme: { barBg: '#2f2418', barFg: '#fff7f2', accent: '#a85a2a', surface: '#fbf6ef', radius: 22, headingCase: 'uppercase' } },
  { id: 'borde', name: 'Editorial', theme: { barBg: '#ffffff', barFg: '#0b0b0b', accent: '#1f1f1f', surface: '#ffffff', radius: 3, headingCase: 'none' } },
];

function parseColor(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function luminance(c: { r: number; g: number; b: number }): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

export function contrast(a: string, b: string): number {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return 0;
  const l1 = luminance(ca);
  const l2 = luminance(cb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export default function ThemeEditor(props: { tenant: Tenant }) {
  const [theme, setTheme] = createSignal<TenantTheme>(props.tenant.theme);
  const [message, setMessage] = createSignal('');
  const [error, setError] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const allowed = createMemo(() => canDo('theme:write'));

  onMount(async () => {
    hydrateAuth(props.tenant.slug);
    const api = await apiReady();
    const live = await api.getTenantById(props.tenant.id);
    if (live) setTheme(live.theme);
  });

  const update = (patch: Partial<TenantTheme>) => setTheme((t) => ({ ...t, ...patch }));

  const barContrast = createMemo(() => contrast(theme().barFg, theme().barBg));
  const accentContrast = createMemo(() => contrast('#ffffff', theme().accent));
  const valid = createMemo(() => barContrast() >= 4.5 && accentContrast() >= 4.5);

  const save = async () => {
    if (!valid()) {
      setError('Hay combinaciones por debajo de 4,5:1. Corregilas antes de guardar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const api = await prepare();
      await api.saveTenant({ ...props.tenant, theme: theme() });
      setMessage('Tema guardado. Se aplica en la tienda al recargar.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const style = () => ({
    '--preview-bar': theme().barBg,
    '--preview-fg': theme().barFg,
    '--preview-accent': theme().accent,
    '--preview-surface': theme().surface,
    '--preview-radius': `${theme().radius}px`,
    '--preview-case': theme().headingCase,
  });

  return (
    <>
      <header class="admin__head">
        <div>
          <p class="eyebrow">Personalización</p>
          <h1 class="admin__title">Tema de la tienda</h1>
        </div>
        <p class="caption">Los cambios se ven en la vista previa y se aplican al guardar.</p>
      </header>

      <Show when={!allowed()}>
        <p class="notice notice--warn">Tu rol no puede editar el tema. Entrá como propietario o administrador.</p>
      </Show>

      <div class="theme-grid">
        <section class="panel">
          <header class="panel__head"><h2 class="panel__title">Colores y forma</h2></header>

          <div class="theme-presets">
            <For each={PRESETS}>
              {(preset) => (
                <button class="ghost" onClick={() => update(preset.theme)}>{preset.name}</button>
              )}
            </For>
          </div>

          <div class="form-grid">
            <div class="field">
              <label for="barBg">Fondo de la barra</label>
              <input id="barBg" type="color" value={theme().barBg} onInput={(e) => update({ barBg: e.currentTarget.value })} />
            </div>
            <div class="field">
              <label for="barFg">Texto de la barra</label>
              <input id="barFg" type="color" value={theme().barFg} onInput={(e) => update({ barFg: e.currentTarget.value })} />
            </div>
            <div class="field">
              <label for="accent">Color de acento</label>
              <input id="accent" type="color" value={theme().accent} onInput={(e) => update({ accent: e.currentTarget.value })} />
            </div>
            <div class="field">
              <label for="surface">Fondo de la tienda</label>
              <input id="surface" type="color" value={theme().surface} onInput={(e) => update({ surface: e.currentTarget.value })} />
            </div>
            <div class="field">
              <label for="radius">Radio de tarjetas</label>
              <select id="radius" value={String(theme().radius)} onChange={(e) => update({ radius: Number(e.currentTarget.value) })}>
                <option value="3">Recto (3 px)</option>
                <option value="10">Suave (10 px)</option>
                <option value="14">Medio (14 px)</option>
                <option value="22">Redondeado (22 px)</option>
              </select>
            </div>
            <div class="field">
              <label for="case">Titulares</label>
              <select
                id="case"
                value={theme().headingCase}
                onChange={(e) => update({ headingCase: e.currentTarget.value as TenantTheme['headingCase'] })}
              >
                <option value="uppercase">Mayúsculas</option>
                <option value="none">Capitalizado</option>
              </select>
            </div>
          </div>

          <div class="theme-checks">
            <p classList={{ 'theme-check': true, 'theme-check--fail': barContrast() < 4.5 }}>
              Texto sobre barra: <strong>{barContrast().toFixed(2)}:1</strong>
              {barContrast() < 4.5 ? ' — por debajo de AA' : ' — AA'}
            </p>
            <p classList={{ 'theme-check': true, 'theme-check--fail': accentContrast() < 4.5 }}>
              Blanco sobre acento: <strong>{accentContrast().toFixed(2)}:1</strong>
              {accentContrast() < 4.5 ? ' — por debajo de AA' : ' — AA'}
            </p>
          </div>

          <Show when={error()}>
            <p class="notice notice--warn" role="alert">{error()}</p>
          </Show>
          <Show when={message()}>
            <p class="notice" aria-live="polite">{message()}</p>
          </Show>

          <button class="ghost" disabled={saving() || !allowed() || !valid()} onClick={() => void save()}>
            {saving() ? 'Guardando' : 'Guardar tema'} <span aria-hidden="true">→</span>
          </button>
        </section>

        <section class="theme-preview" style={style()} aria-label="Vista previa del tema">
          <header class="theme-preview__bar">
            <span class="theme-preview__brand">{props.tenant.monogram} {props.tenant.name}</span>
            <span class="theme-preview__cart">Carrito [0]</span>
          </header>
          <div class="theme-preview__body">
            <p class="theme-preview__eyebrow">Vista previa</p>
            <h3 class="theme-preview__title">Botellas que duran todo el día</h3>
            <p class="theme-preview__text">Así se ve la portada con la tipografía y los colores elegidos.</p>
            <div class="theme-preview__cards">
              <article class="theme-preview__card">
                <div class="theme-preview__img" />
                <p class="theme-preview__name">Botella térmica 40oz</p>
                <p class="theme-preview__price">Bs.- 349,00</p>
              </article>
              <article class="theme-preview__card">
                <div class="theme-preview__img" />
                <p class="theme-preview__name">Molino de café</p>
                <p class="theme-preview__price">Bs.- 449,00</p>
              </article>
            </div>
            <span class="theme-preview__button">Agregar →</span>
          </div>
        </section>
      </div>
    </>
  );
}
