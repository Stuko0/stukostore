// Aplica el tema guardado de la tienda en runtime. El layout del storefront
// pre-renderiza el tema de la semilla; este isla lo actualiza si el dueño lo
// cambió desde el editor del panel.

import { onMount } from 'solid-js';
import { prepare } from '../../lib/api/mock';

const ROOT = () => document.documentElement;

function apply(theme: { barBg: string; barFg: string; accent: string; surface: string; radius: number; headingCase: string }) {
  const root = ROOT();
  root.style.setProperty('--brand-bar-bg', theme.barBg);
  root.style.setProperty('--brand-bar-fg', theme.barFg);
  root.style.setProperty('--brand-accent', theme.accent);
  root.style.setProperty('--page-surface', theme.surface);
  root.style.setProperty('--r-md', `${theme.radius}px`);
  root.style.setProperty('--heading-case', theme.headingCase === 'none' ? 'none' : 'uppercase');
}

export default function ThemeApplier(props: { tenantId: string }) {
  onMount(async () => {
    const api = await prepare();
    const tenant = await api.getTenantById(props.tenantId);
    if (!tenant) return;
    apply(tenant.theme);
  });

  return null;
}

export { apply as applyTheme };
