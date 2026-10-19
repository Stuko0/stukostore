// Checkout: cupón, envío, impuesto y creación del pedido.
// Las opciones de pago y el cupón dependen del plan activo.

import { createSignal, createMemo, onMount, For, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import { bob } from '../../lib/format';
import { can } from '../../lib/tiers';
import { cart, cartSubtotal, clearCart, hydrateSession, loadCart, rememberTenant, tier } from '../../lib/store';
import type { Discount, ShippingZone, Tenant } from '../../lib/types';
import Locked from '../tier/Locked';
import './store.css';

export default function Checkout(props: { tenant: Tenant }) {
  const [zones, setZones] = createSignal<ShippingZone[]>([]);
  const [discount, setDiscount] = createSignal<Discount | null>(null);
  const [couponInput, setCouponInput] = createSignal('');
  const [couponError, setCouponError] = createSignal('');
  const [shippingMethod, setShippingMethod] = createSignal<'retiro' | 'local' | 'nacional'>('local');
  const [payment, setPayment] = createSignal<'qr' | 'transferencia' | 'contra-entrega' | 'pasarela'>('qr');
  const [form, setForm] = createSignal({
    name: '',
    phone: '',
    email: '',
    city: 'Cochabamba',
    line1: '',
    reference: '',
  });
  const [error, setError] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [created, setCreated] = createSignal<{ code: string; total: number } | null>(null);

  const subtotal = () => cartSubtotal();
  const discountValue = createMemo(() => {
    const d = discount();
    if (!d) return 0;
    if (d.type === 'porcentaje') return Math.round(subtotal() * (d.value / 100) * 100) / 100;
    if (d.type === 'monto') return Math.min(d.value, subtotal());
    return 0;
  });

  const cities = createMemo(() => {
    const list = zones().flatMap((z) => z.cities);
    return [...new Set(list)].sort((a, b) => a.localeCompare(b));
  });

  const shipping = createMemo(() => {
    if (shippingMethod() === 'retiro') return 0;
    const zone = zones().find((z) => z.cities.some((c) => c.toLowerCase() === form().city.toLowerCase()));
    if (!zone) return 0;
    if (zone.freeAbove !== null && subtotal() - discountValue() >= zone.freeAbove) return 0;
    return shippingMethod() === 'nacional' ? zone.rate : zone.rate;
  });

  const taxable = () => Math.max(0, subtotal() - discountValue());
  const tax = () => Math.round(taxable() * props.tenant.taxRate * 100) / 100;
  const total = () => Math.round((taxable() + shipping()) * 100) / 100;

  onMount(async () => {
    hydrateSession();
    rememberTenant(props.tenant.slug);
    // El carrito vive en localStorage por tienda: hay que cargarlo antes de
    // resumir el pedido, incluso si el visitante entra directo a /checkout/.
    loadCart(props.tenant.id);
    const api = await prepare();
    setZones(await api.listZones(props.tenant.id));
    const first = (await api.listZones(props.tenant.id))[0];
    if (first?.cities[0]) {
      setForm((f) => ({ ...f, city: first.cities[0] }));
    }
  });

  const update = (key: keyof ReturnType<typeof form>, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const applyCoupon = async () => {
    const api = await prepare();
    const found = await api.findDiscount(props.tenant.id, couponInput());
    if (!found) {
      setDiscount(null);
      setCouponError('Ese cupón no existe o ya venció.');
      return;
    }
    if (subtotal() < found.minSubtotal) {
      setDiscount(null);
      setCouponError(`El cupón aplica desde ${bob(found.minSubtotal)} de compra.`);
      return;
    }
    setCouponError('');
    setDiscount(found);
  };

  const submit = async () => {
    if (!cart().length) {
      setError('El carrito está vacío.');
      return;
    }
    if (!form().name.trim() || !form().phone.trim() || !form().city.trim()) {
      setError('Completá nombre, teléfono y ciudad para confirmar el pedido.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const api = await prepare();
      const order = await api.createOrder({
        tenantId: props.tenant.id,
        customer: {
          name: form().name,
          phone: form().phone,
          email: form().email,
          city: form().city,
          address: {
            line1: form().line1,
            city: form().city,
            zone: shippingMethod(),
            reference: form().reference,
          },
        },
        items: cart().map((line) => ({
          variantId: line.variantId,
          productId: line.productId,
          title: line.title,
          sku: '',
          options: line.options,
          qty: line.qty,
          price: line.price,
        })),
        subtotal: subtotal(),
        discount: discountValue(),
        couponCode: discount()?.code ?? null,
        shipping: shipping(),
        tax: tax(),
        total: total(),
        paymentMethod: payment(),
        shippingMethod: shippingMethod(),
      });
      clearCart(props.tenant.id);
      setCreated({ code: order.code, total: order.total });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section class="shell checkout__done" classList={{ 'is-hidden': !created() }}>
        <p class="eyebrow">Pedido registrado</p>
        <p class="checkout__code">{created()?.code}</p>
        <p>
          Total {bob(created()?.total ?? 0)}. Guardá este código para consultar el estado:
          en la tienda real el cliente lo recibe por WhatsApp al confirmar el pago.
        </p>
        <p style="margin-top: var(--space-24)">
          <a class="ghost" href={`/t/${props.tenant.slug}/pedido/?code=${created()?.code ?? ''}`}>
            Ver seguimiento <span aria-hidden="true">→</span>
          </a>{' '}
          <a class="ghost" href={`/t/${props.tenant.slug}/`}>
            Seguir comprando <span aria-hidden="true">→</span>
          </a>
        </p>
      </section>

      <div class="shell checkout" classList={{ 'is-hidden': !!created() }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <h1 class="h2" style="margin-bottom: var(--space-24)">Finalizar compra</h1>

          <Show when={error()}>
            <p class="checkout__error" role="alert">{error()}</p>
          </Show>

          <div class="checkout__row">
            <div class="checkout__field">
              <label for="name">Nombre y apellido</label>
              <input id="name" value={form().name} onInput={(e) => update('name', e.currentTarget.value)} required />
            </div>
            <div class="checkout__field">
              <label for="phone">WhatsApp</label>
              <input id="phone" value={form().phone} onInput={(e) => update('phone', e.currentTarget.value)} required />
            </div>
          </div>

          <div class="checkout__row">
            <div class="checkout__field">
              <label for="email">Correo (opcional)</label>
              <input id="email" type="email" value={form().email} onInput={(e) => update('email', e.currentTarget.value)} />
            </div>
            <div class="checkout__field">
              <label for="city">Ciudad</label>
              <select id="city" value={form().city} onChange={(e) => update('city', e.currentTarget.value)}>
                <For each={cities()}>{(city) => <option value={city}>{city}</option>}</For>
              </select>
            </div>
          </div>

          <div class="checkout__field">
            <label for="address">Dirección</label>
            <input id="address" value={form().line1} onInput={(e) => update('line1', e.currentTarget.value)} />
          </div>
          <div class="checkout__field">
            <label for="reference">Referencia</label>
            <input id="reference" value={form().reference} onInput={(e) => update('reference', e.currentTarget.value)} />
          </div>

          <fieldset class="checkout__field" style="border:0; padding:0">
            <legend class="detail__option-label">Entrega</legend>
            <div class="detail__values">
              <For each={['retiro', 'local', 'nacional'] as const}>
                {(method) => (
                  <button
                    type="button"
                    class="detail__value"
                    aria-pressed={shippingMethod() === method}
                    onClick={() => setShippingMethod(method)}
                  >
                    {method === 'retiro' ? 'Retiro en tienda' : method === 'local' ? 'Envío local' : 'Envío nacional'}
                  </button>
                )}
              </For>
            </div>
          </fieldset>

          <fieldset class="checkout__field" style="border:0; padding:0">
            <legend class="detail__option-label">Pago</legend>
            <div class="detail__values">
              <For each={['qr', 'transferencia', 'contra-entrega'] as const}>
                {(method) => (
                  <button
                    type="button"
                    class="detail__value"
                    aria-pressed={payment() === method}
                    onClick={() => setPayment(method)}
                  >
                    {method === 'qr' ? 'QR' : method === 'transferencia' ? 'Transferencia' : 'Contra entrega'}
                  </button>
                )}
              </For>
              <Show
                when={can(tier(), 'online_payments')}
                fallback={<span class="caption">Pago con tarjeta: desde el plan TIENDA</span>}
              >
                <button
                  type="button"
                  class="detail__value"
                  aria-pressed={payment() === 'pasarela'}
                  onClick={() => setPayment('pasarela')}
                >
                  Tarjeta (pasarela)
                </button>
              </Show>
            </div>
          </fieldset>

          <Show
            when={can(tier(), 'coupons')}
            fallback={<Locked feature="coupons" compact />}
          >
            <div class="checkout__field">
              <label for="coupon">Cupón</label>
              <div style="display:flex; gap: var(--space-8)">
                <input
                  id="coupon"
                  value={couponInput()}
                  onInput={(e) => setCouponInput(e.currentTarget.value.toUpperCase())}
                />
                <button type="button" class="ghost" onClick={() => void applyCoupon()}>
                  Aplicar
                </button>
              </div>
              <Show when={couponError()}>
                <p class="caption" style="color: var(--color-terracotta-alert)">{couponError()}</p>
              </Show>
              <Show when={discount()}>
                <p class="caption">Cupón {discount()!.code} aplicado.</p>
              </Show>
            </div>
          </Show>
        </form>

        <aside class="checkout__summary">
          <p class="eyebrow" style="margin-bottom: var(--space-16)">Resumen</p>
          <ul class="checkout__lines" classList={{ 'is-hidden': !cart().length }}>
            <For each={cart()}>
              {(line) => (
                <li class="checkout__line">
                  <span>{line.qty} × {line.title}</span>
                  <span>{bob(line.price * line.qty)}</span>
                </li>
              )}
            </For>
          </ul>

          <p class="cart__empty" classList={{ 'is-hidden': !!cart().length }}>
            No hay productos en el carrito. Agregá algo del catálogo para seguir.
          </p>

          <div class="checkout__totals" classList={{ 'is-hidden': !cart().length }}>
            <p class="checkout__line"><span>Subtotal</span><span>{bob(subtotal())}</span></p>
            <p class="checkout__line" classList={{ 'is-hidden': !discountValue() }}>
              <span>Descuento</span><span>− {bob(discountValue())}</span>
            </p>
            <p class="checkout__line">
              <span>Envío</span>
              <span>{shipping() === 0 ? 'Gratis' : bob(shipping())}</span>
            </p>
            <p class="checkout__line">
              <span>IVA {Math.round(props.tenant.taxRate * 100)} %</span>
              <span>{bob(tax())}</span>
            </p>
            <p class="checkout__total"><span>Total</span><span>{bob(total())}</span></p>
          </div>

          <button
            class="ghost"
            style="margin-top: var(--space-16); width:100%; justify-content:center"
            classList={{ 'is-hidden': !cart().length }}
            disabled={busy()}
            onClick={() => void submit()}
          >
            {busy() ? 'Registrando pedido' : 'Confirmar pedido'} <span aria-hidden="true">→</span>
          </button>

          <p class="caption" style="margin-top: var(--space-12)" classList={{ 'is-hidden': !cart().length }}>
            En la tienda real el pedido llega al WhatsApp del vendedor con este mismo detalle.
          </p>
        </aside>
      </div>
    </>
  );
}
