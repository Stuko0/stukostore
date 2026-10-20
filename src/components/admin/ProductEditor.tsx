// Alta y edición de producto: variantes, imágenes con texto alternativo y SEO.
// Regla aplicada: no se guarda una imagen sin `alt` (el fallo medido en la
// tienda original era 11 de 11 sin texto alternativo).

import { createSignal, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob, slugify } from '../../lib/format';
import type { Collection, Product, ProductImage, Tenant, Variant } from '../../lib/types';
import './admin.css';

const GALLERY = [
  'termo-40oz', 'termo-32oz', 'termo-16oz', 'taza-14oz', 'molino-cafe',
  'dripper-porcelana', 'tetera-cisne', 'chemex', 'cafe-grano', 'cafe-molido',
  'prensa-francesa', 'mochila-outdoor', 'botella-outdoor', 'linterna',
  'saco-dormir', 'carpa', 'cantimplora',
];

function emptyProduct(tenantId: string): Product {
  return {
    id: `p-${Date.now()}`,
    tenantId,
    slug: '',
    title: '',
    description: '',
    status: 'borrador',
    collectionIds: [],
    tags: [],
    options: [],
    variants: [{ id: `v-${Date.now()}`, sku: '', options: {}, price: 0, compareAt: null, cost: 0, barcode: null, active: true }],
    images: [{ src: `/img/${GALLERY[0]}.jpg`, alt: '' }],
    seo: { title: '', description: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function ProductEditor(props: { tenant: Tenant; productId?: string }) {
  const [product, setProduct] = createSignal<Product>(emptyProduct(props.tenant.id));
  const [collections, setCollections] = createSignal<Collection[]>([]);
  const [error, setError] = createSignal('');
  const [saved, setSaved] = createSignal('');
  const [loading, setLoading] = createSignal(true);

  const update = (patch: Partial<Product>) => setProduct((p) => ({ ...p, ...patch }));

  const updateVariant = (index: number, patch: Partial<Variant>) => {
    setProduct((p) => ({
      ...p,
      variants: p.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  };

  const updateImage = (index: number, patch: Partial<ProductImage>) => {
    setProduct((p) => ({
      ...p,
      images: p.images.map((img, i) => (i === index ? { ...img, ...patch } : img)),
    }));
  };

  onMount(async () => {
    const api = await prepare();
    const id = props.productId ?? new URLSearchParams(window.location.search).get('id') ?? undefined;
    const [cols, existing] = await Promise.all([
      api.listCollections(props.tenant.id),
      id ? api.getProduct(id) : Promise.resolve(null),
    ]);
    setCollections(cols);
    if (existing) setProduct(existing);
    setLoading(false);
  });

  const toggleCollection = (id: string) => {
    const current = product().collectionIds;
    update({
      collectionIds: current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    });
  };

  const addVariant = () => {
    update({
      variants: [
        ...product().variants,
        {
          id: `v-${Date.now()}`,
          sku: '',
          options: {},
          price: 0,
          compareAt: null,
          cost: 0,
          barcode: null,
          active: true,
        },
      ],
    });
  };

  const removeVariant = (index: number) => {
    update({ variants: product().variants.filter((_, i) => i !== index) });
  };

  const addImage = () => {
    update({ images: [...product().images, { src: `/img/${GALLERY[0]}.jpg`, alt: '' }] });
  };

  const save = async () => {
    const current = product();
    if (!current.title.trim()) {
      setError('El producto necesita un nombre.');
      return;
    }
    if (!current.variants.length || current.variants.some((v) => !v.sku.trim())) {
      setError('Cada variante necesita un SKU.');
      return;
    }
    if (current.variants.some((v) => v.price <= 0)) {
      setError('Cada variante necesita un precio mayor a cero.');
      return;
    }
    const withoutAlt = current.images.filter((img) => !img.alt.trim());
    if (current.images.length && withoutAlt.length) {
      setError('Toda imagen necesita texto alternativo: describe qué se ve, no la marca.');
      return;
    }
    setError('');
    const api = await prepare();
    const saved_ = await api.saveProduct({
      ...current,
      slug: current.slug || slugify(current.title),
      seo: {
        title: current.seo.title || current.title,
        description: current.seo.description || current.description.slice(0, 150),
      },
    });
    setProduct(saved_);
    setSaved(`Guardado. Estado: ${saved_.status}.`);
  };

  return (
    <>
      <header class="admin__head">
        <div>
          <p class="eyebrow">Catálogo</p>
          <h1 class="admin__title">{props.productId ? 'Editar producto' : 'Nuevo producto'}</h1>
        </div>
        <div class="actions">
          <a class="link-button" href={`/admin/${props.tenant.slug}/productos/`}>Volver a la lista</a>
        </div>
      </header>

      <Show when={!loading()} fallback={<p class="caption">Cargando producto…</p>}>
        <Show when={error()}>
          <p class="notice notice--warn" role="alert">{error()}</p>
        </Show>
        <Show when={saved()}>
          <p class="notice" aria-live="polite">
            {saved()} <a class="link-button" href={`/admin/${props.tenant.slug}/productos/`}>Ver lista</a>
          </p>
        </Show>

        <section class="panel">
          <header class="panel__head"><h2 class="panel__title">Datos del producto</h2></header>
          <div class="form-grid">
            <div class="field field--wide">
              <label for="title">Nombre</label>
              <input id="title" value={product().title} onInput={(e) => update({ title: e.currentTarget.value })} />
            </div>
            <div class="field field--wide">
              <label for="description">Descripción</label>
              <textarea
                id="description"
                rows="3"
                value={product().description}
                onInput={(e) => update({ description: e.currentTarget.value })}
              />
            </div>
            <div class="field">
              <label for="status">Estado</label>
              <select id="status" value={product().status} onChange={(e) => update({ status: e.currentTarget.value as Product['status'] })}>
                <option value="borrador">Borrador</option>
                <option value="activo">Activo</option>
                <option value="archivado">Archivado</option>
              </select>
            </div>
            <div class="field">
              <label for="tags">Etiquetas (separadas por coma)</label>
              <input
                id="tags"
                value={product().tags.join(', ')}
                onInput={(e) => update({ tags: e.currentTarget.value.split(',').map((t) => t.trim()).filter(Boolean) })}
              />
            </div>
            <div class="field field--wide">
              <label for="collections">Colecciones</label>
              <div class="detail__values" style="flex-wrap: wrap">
                <For each={collections()}>
                  {(collection) => (
                    <button
                      type="button"
                      class="detail__value"
                      aria-pressed={product().collectionIds.includes(collection.id)}
                      onClick={() => toggleCollection(collection.id)}
                    >
                      {collection.title}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <header class="panel__head">
            <h2 class="panel__title">Variantes</h2>
            <button class="link-button" onClick={addVariant}>Agregar variante</button>
          </header>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">SKU</th>
                <th scope="col">Opciones (ej. Color: Negro)</th>
                <th scope="col">Precio</th>
                <th scope="col">Antes</th>
                <th scope="col">Costo</th>
                <th scope="col">Activa</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              <For each={product().variants}>
                {(variant, index) => (
                  <tr>
                    <td>
                      <input value={variant.sku} onInput={(e) => updateVariant(index(), { sku: e.currentTarget.value })} />
                    </td>
                    <td>
                      <input
                        value={Object.entries(variant.options).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        placeholder="Color: Negro"
                        onChange={(e) => {
                          const options: Record<string, string> = {};
                          const key = product().options[0]?.name;
                          if (key) options[key] = e.currentTarget.value.split(':').slice(1).join(':').trim();
                          updateVariant(index(), { options });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={variant.price}
                        onInput={(e) => updateVariant(index(), { price: Number(e.currentTarget.value) || 0 })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={variant.compareAt ?? ''}
                        onInput={(e) => updateVariant(index(), { compareAt: e.currentTarget.value ? Number(e.currentTarget.value) : null })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={variant.cost}
                        onInput={(e) => updateVariant(index(), { cost: Number(e.currentTarget.value) || 0 })}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={variant.active}
                        onChange={(e) => updateVariant(index(), { active: e.currentTarget.checked })}
                      />
                    </td>
                    <td>
                      <Show when={product().variants.length > 1}>
                        <button class="link-button" onClick={() => removeVariant(index())}>Quitar</button>
                      </Show>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
          <p class="caption" style="margin-top: var(--s-12)">
            Margen sobre el primer precio: {bob(Math.max(0, product().variants[0].price - product().variants[0].cost))}
          </p>
        </section>

        <section class="panel">
          <header class="panel__head">
            <h2 class="panel__title">Imágenes</h2>
            <button class="link-button" onClick={addImage}>Agregar imagen</button>
          </header>
          <For each={product().images}>
            {(image, index) => (
              <div class="form-grid">
                <div class="field">
                  <label for={`img-${index()}`}>Archivo</label>
                  <select
                    id={`img-${index()}`}
                    value={image.src}
                    onChange={(e) => updateImage(index(), { src: e.currentTarget.value })}
                  >
                    <For each={GALLERY}>
                      {(name) => <option value={`/img/${name}.jpg`}>{name}.jpg</option>}
                    </For>
                  </select>
                </div>
                <div class="field">
                  <label for={`alt-${index()}`}>Texto alternativo (obligatorio)</label>
                  <input
                    id={`alt-${index()}`}
                    value={image.alt}
                    onInput={(e) => updateImage(index(), { alt: e.currentTarget.value })}
                  />
                </div>
              </div>
            )}
          </For>
        </section>

        <section class="panel">
          <header class="panel__head"><h2 class="panel__title">Posicionamiento</h2></header>
          <div class="form-grid">
            <div class="field field--wide">
              <label for="seo-title">Título para buscadores</label>
              <input
                id="seo-title"
                value={product().seo.title}
                onInput={(e) => update({ seo: { ...product().seo, title: e.currentTarget.value } })}
              />
            </div>
            <div class="field field--wide">
              <label for="seo-desc">Descripción para buscadores</label>
              <input
                id="seo-desc"
                value={product().seo.description}
                onInput={(e) => update({ seo: { ...product().seo, description: e.currentTarget.value } })}
              />
            </div>
            <div class="field field--wide">
              <label for="slug">Dirección</label>
              <input
                id="slug"
                value={product().slug || slugify(product().title)}
                onInput={(e) => update({ slug: e.currentTarget.value })}
              />
            </div>
          </div>
        </section>

        <div class="actions">
          <button class="ghost" onClick={() => void save()}>
            Guardar producto <span aria-hidden="true">→</span>
          </button>
          <a class="link-button" href={`/admin/${props.tenant.slug}/productos/`}>Cancelar</a>
        </div>
      </Show>
    </>
  );
}
