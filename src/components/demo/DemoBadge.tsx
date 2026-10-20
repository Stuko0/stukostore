// Badge DEMO: deja claro en pantalla que los datos viven en este navegador y
// ofrece reiniciar la demo. Se abre desde el encabezado o desde el panel.

import { createSignal, onMount, Show } from 'solid-js';
import { prepare } from '../../lib/api/mock';
import './demo-badge.css';

export default function DemoBadge() {
  const [open, setOpen] = createSignal(false);
  const [resetting, setResetting] = createSignal(false);

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
  });

  const reset = async () => {
    setResetting(true);
    const api = await prepare();
    await api.resetDemo();
    window.localStorage.removeItem('stukostore.tier');
    window.localStorage.removeItem('stukostore.tenant');
    window.location.reload();
  };

  return (
    <>
      <button class="demo-badge" onClick={() => setOpen(true)} aria-haspopup="dialog">
        Demo
      </button>

      <Show when={open()}>
        <div class="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-title">
          <div class="demo-modal__card">
            <header class="demo-modal__head">
              <p class="eyebrow">Demostración</p>
              <button class="demo-modal__close" onClick={() => setOpen(false)} aria-label="Cerrar">
                Cerrar
              </button>
            </header>
            <h2 class="demo-modal__title" id="demo-title">Los datos viven en tu navegador</h2>
            <p class="demo-modal__text">
              Todo lo que cargues, edites o vendas se guarda en la cache local de este
              navegador. No hay servidor: nada se envía a ningún lado y no hay cuentas
              reales.
            </p>
            <ul class="demo-modal__list">
              <li>Podés crear productos, cambiar precios y registrar pedidos sin miedo.</li>
              <li>Si abrís la demo en otro navegador o en otro equipo, empieza vacía.</li>
              <li>El botón de reinicio vuelve a los datos de fábrica.</li>
            </ul>
            <div class="demo-modal__actions">
              <button class="ghost" onClick={() => void reset()} disabled={resetting()}>
                {resetting() ? 'Reiniciando' : 'Reiniciar demo'}
              </button>
              <a class="ghost ghost--solid" href="/demo/">Ver las tiendas</a>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
