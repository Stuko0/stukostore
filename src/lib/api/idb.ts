// Envoltorio mínimo de IndexedDB para la demo.
// Sin dependencias: la demo guarda todo en el navegador del visitante.

export const DB_NAME = 'stukostore';
export const DB_VERSION = 1;

export const STORES = [
  'meta',
  'tenants',
  'locations',
  'products',
  'collections',
  'inventory',
  'movements',
  'customers',
  'orders',
  'discounts',
  'zones',
  'automations',
  'pages',
  'blocks',
] as const;

export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function available(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function open(): Promise<IDBDatabase> {
  if (!available()) {
    return Promise.reject(new Error('IndexedDB no está disponible en este navegador.'));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id' });
          if (name !== 'meta') store.createIndex('tenantId', 'tenantId');
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function all<T>(store: StoreName): Promise<T[]> {
  const db = await open();
  return request(db.transaction(store, 'readonly').objectStore(store).getAll() as IDBRequest<T[]>);
}

export async function byTenant<T extends { tenantId: string }>(store: StoreName, tenantId: string): Promise<T[]> {
  const db = await open();
  const index = db.transaction(store, 'readonly').objectStore(store).index('tenantId');
  return request(index.getAll(tenantId) as IDBRequest<T[]>);
}

export async function get<T>(store: StoreName, id: string): Promise<T | undefined> {
  const db = await open();
  return request(db.transaction(store, 'readonly').objectStore(store).get(id) as IDBRequest<T | undefined>);
}

export async function put<T>(store: StoreName, value: T): Promise<T> {
  const db = await open();
  await request(db.transaction(store, 'readwrite').objectStore(store).put(value as unknown as object));
  return value;
}

export async function putMany<T>(store: StoreName, values: T[]): Promise<void> {
  if (!values.length) return;
  const db = await open();
  const tx = db.transaction(store, 'readwrite');
  const os = tx.objectStore(store);
  for (const value of values) os.put(value as unknown as object);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function remove(store: StoreName, id: string): Promise<void> {
  const db = await open();
  await request(db.transaction(store, 'readwrite').objectStore(store).delete(id));
}

export async function clearAll(): Promise<void> {
  const db = await open();
  const tx = db.transaction([...STORES], 'readwrite');
  for (const name of STORES) tx.objectStore(name).clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
