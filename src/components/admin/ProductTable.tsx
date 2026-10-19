// Lista de productos con búsqueda, filtro por estado y límite del plan.

import { createSignal, createMemo, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob, shortDate } from '../../lib/format';
import { limitFor } from '../../lib/tiers';
import { hydrateSession, tier } from '../../lib/store';
import type { Product, Tenant } from '../../lib/types';
import './admin.css';

export default function ProductTable(props: { tenant: Tenant }) {
  const [products, setProducts] = createSignal<Product[]>([]);
  const [query, setQuery] = createSignal('');
  const [status, setStatus] = createSignal<'todos' | Product['status']>('todos');
  const [loading, setLoading] = createSignal(true);
  const [message, setMessage] = createSignal('');

  const load = async () => {
    const api = await prepare();
    setProducts(await api.listProducts(props.tenant.id));
    setLoading(false);
  };

  onMount(async () => {
    hydrateSession();
    await load();
  });

  const limit = () => limitFor(tier(), 'products');
  const published = () => products().filter((p) => p.status === 'activo').length;
  const atLimit = () => Number.isFinite(limit()) && published() >= limit();

  const visible = createMemo(() => {
    const q = query().trim().toLowerCase();
    return products().filter((p) => {
      if (status() !== 'todos' && p.status !== status()) return false;
      if (!q) return true;
      return `${p.title} ${p.tags.join(' ')}`.toLowerCase().includes(q);
    });
  });

  const variantSummary = (product: Product) => {
    if (product.variants.length === 1) return product.variants[0].sku;
    return `${product.variants.length} variantes`;
  };

  const priceRange = (product: Product) => {
    const prices = product.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? bob(min) : `${bob(min)} – ${bob(max)}`;
  };

  const duplicate = async (product: Product) => {
    const api = await prepare();
    const copy = await api.duplicateProduct(product.id);
    await load();
    setMessage(`Se creó ${copy.title} como borrador.`);
  };

  const archive = async (product: Product) => {
    const api = await prepare();
    await api.setProductStatus(product.id, product.status === 'archivado' ? 'activo' : 'archivado');
    await load();
    setMessage(`${product.title} ahora está ${product.status === 'archivado' ? 'activo' : 'archivado'}.`);
  };

  return (
    <>
      <header class="admin__head">
        <div>
          <p class="eyebrow">Catálogo</p>
          <h1 class="admin__title">Productos</h1>
        </div>
        <div class="actions">
          <span class="pill">
            {published()} publicados
            {Number.isFinite(limit()) ? ` de ${limit()}` : ' · sin límite'}
          </span>
          <Show
            when={!atLimit()}
            fallback={
              <span class="pill pill--archivado">
                Límite del plan alcanzado
              </span>
            }
          >
            <a class="ghost" href={`/admin/${props.tenant.slug}/productos/nuevo/`}>
              Nuevo producto <span aria-hidden="true">→</span>
            </a>
          </Show>
        </div>
      </header>

      <Show when={atLimit()}>
        <p class="notice notice--warn">
          Publicaste {published()} productos y el plan permite {limit()}. Para seguir cargando
          catálogo hay que subir de plan: el límite se aplica de verdad, no es una advertencia.
        </p>
      </Show>

      <div class="toolbar">
        <label class="sr-only" for="q">Buscar producto</label>
        <input
          id="q"
          placeholder="Buscar por nombre o etiqueta"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
        />
        <label class="sr-only" for="status">Estado</label>
        <select id="status" value={status()} onChange={(e) => setStatus(e.currentTarget.value as never)}>
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="borrador">Borradores</option>
          <option value="archivado">Archivados</option>
        </select>
        <span class="caption">{visible().length} resultados</span>
      </div>

      <Show when={message()}>
        <p class="notice" aria-live="polite">{message()}</p>
      </Show>

      <Show when={!loading()} fallback={<p class="caption">Cargando catálogo…</p>}>
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col">Estado</th>
              <th scope="col">Variantes</th>
              <th scope="col" class="table__num">Precio</th>
              <th scope="col">Actualizado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <For each={visible()}>
              {(product) => (
                <tr>
                  <td>
                    <div class="table__product">
                      <Show when={product.images[0]}>
                        <img class="table__thumb" src={product.images[0].src} alt="" width="40" height="40" loading="lazy" />
                      </Show>
                      <span>{product.title}</span>
                    </div>
                  </td>
                  <td><span class={`pill pill--${product.status}`}>{product.status}</span></td>
                  <td>{variantSummary(product)}</td>
                  <td class="table__num">{priceRange(product)}</td>
                  <td>{shortDate(product.updatedAt)}</td>
                  <td>
                    <div class="actions">
                      <a
                        class="link-button"
                        href={`/admin/${props.tenant.slug}/productos/editar/?id=${product.id}`}
                      >
                        Editar
                      </a>
                      <button class="link-button" onClick={() => void duplicate(product)}>Duplicar</button>
                      <button class="link-button" onClick={() => void archive(product)}>
                        {product.status === 'archivado' ? 'Reactivar' : 'Archivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </>
  );
}
