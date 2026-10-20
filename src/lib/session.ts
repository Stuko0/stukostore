// Sesión simulada del panel. No es seguridad: es una demostración de roles,
// y el badge DEMO lo dice en pantalla. Vive en localStorage del navegador.

import { createSignal } from 'solid-js';

export type Role = 'propietario' | 'administrador' | 'operador' | 'lector';

export const ROLES: Role[] = ['propietario', 'administrador', 'operador', 'lector'];

export const ROLE_LABEL: Record<Role, string> = {
  propietario: 'Propietario',
  administrador: 'Administrador',
  operador: 'Operador',
  lector: 'Lector',
};

export const ROLE_HINT: Record<Role, string> = {
  propietario: 'Todo, incluido el plan y el equipo.',
  administrador: 'Todo el catálogo y la operación, sin gestionar el equipo.',
  operador: 'Pedidos e inventario; catálogo en solo lectura.',
  lector: 'Solo lectura en todo el panel.',
};

export type Action =
  | 'catalog:read'
  | 'catalog:write'
  | 'orders:read'
  | 'orders:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'theme:write'
  | 'plan:read'
  | 'team:write';

const MATRIX: Record<Role, Action[]> = {
  propietario: [
    'catalog:read', 'catalog:write', 'orders:read', 'orders:write',
    'inventory:read', 'inventory:write', 'theme:write', 'plan:read', 'team:write',
  ],
  administrador: [
    'catalog:read', 'catalog:write', 'orders:read', 'orders:write',
    'inventory:read', 'inventory:write', 'theme:write', 'plan:read',
  ],
  operador: [
    'catalog:read', 'orders:read', 'orders:write', 'inventory:read', 'inventory:write', 'plan:read',
  ],
  lector: ['catalog:read', 'orders:read', 'inventory:read', 'plan:read'],
};

export interface Session {
  tenantSlug: string;
  name: string;
  role: Role;
}

const KEY = (tenant: string) => `stukostore.session.${tenant}`;

export const [session, setSession] = createSignal<Session | null>(null);

export function hydrateAuth(tenantSlug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(KEY(tenantSlug));
    if (!raw) {
      setSession(null);
      return;
    }
    const parsed = JSON.parse(raw) as Session;
    setSession(parsed.tenantSlug === tenantSlug ? parsed : null);
  } catch {
    setSession(null);
  }
}

export function login(tenantSlug: string, name: string, role: Role): Session {
  const next: Session = { tenantSlug, name: name.trim() || ROLE_LABEL[role], role };
  setSession(next);
  try {
    window.localStorage.setItem(KEY(tenantSlug), JSON.stringify(next));
  } catch {
    /* almacenamiento bloqueado: la sesión vive solo en memoria */
  }
  return next;
}

export function logout(tenantSlug: string): void {
  setSession(null);
  try {
    window.localStorage.removeItem(KEY(tenantSlug));
  } catch {
    /* nada que limpiar */
  }
}

export function canDo(action: Action): boolean {
  const current = session();
  if (!current) return false;
  return MATRIX[current.role].includes(action);
}

export function isReadOnly(): boolean {
  return session()?.role === 'lector';
}
