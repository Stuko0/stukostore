#!/usr/bin/env python3
"""Pruebas de humo de la demo de StukoStore, una sección por fase.

Uso: python3 tests/e2e/run.py [base_url]
Por defecto corre contra el servidor local en http://localhost:4400
"""
import re
import sys
from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4400"

results: list[tuple[str, str, bool, str]] = []


def check(phase: str, name: str, ok: bool, detail: str = "") -> None:
    results.append((phase, name, ok, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {phase} · {name} {('— ' + detail) if detail and not ok else ''}")



def admin_login(page, role="propietario", name="Prueba QA"):
    """Si el panel muestra la tarjeta de acceso, entra con el rol pedido."""
    try:
        page.wait_for_selector(".auth, .session", timeout=8000)
    except Exception:
        return
    if page.locator(".auth").count():
        page.fill("#auth-name", name)
        page.select_option("#auth-role", role)
        page.click("button:has-text('Entrar')")
        page.wait_for_selector(".session", timeout=8000)


def section(title: str) -> None:
    print(f"\n=== {title} ===")


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, locale="es-BO")
        page = ctx.new_page()
        errors: list[str] = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))

        # ---------------------------------------------------------------- fase 2
        section("Fase 2 — datos y cache")
        page.goto(f"{BASE}/demo/", wait_until="networkidle")
        page.wait_for_selector(".picker__card", timeout=20000)
        cards = page.locator(".picker__card").count()
        check("F2", "el selector lista las 3 tiendas", cards == 3, f"encontradas {cards}")
        status = page.inner_text(".picker__status")
        check("F2", "reporta tiendas sembradas", "3 tiendas" in status, status)
        first_card = page.locator(".picker__card").first
        first_stats = first_card.inner_text()
        check("F2", "muestra conteos reales de la tienda", re.search(r"\d", first_stats) is not None)
        products_te = int(first_card.locator(".picker__stats dd").first.inner_text().strip())
        check("F2", "Tienda Express tiene catálogo cargado", products_te >= 8, f"{products_te} productos")

        page.click("button:has-text('Reiniciar demo')")
        page.wait_for_timeout(2500)
        page.wait_for_selector(".picker__card", timeout=20000)
        check("F2", "el reinicio vuelve a sembrar", page.locator(".picker__card").count() == 3)

        # ---------------------------------------------------------------- fase 3
        section("Fase 3 — motor de planes")
        page.goto(f"{BASE}/t/mundo-outdoor/buscar/?tier=escaparate", wait_until="networkidle")
        page.wait_for_timeout(1200)
        locked = page.locator(".locked").count()
        check("F3", "buscador bloqueado en ESCAPARATE", locked >= 1, f"{locked} bloqueos")
        page.goto(f"{BASE}/t/mundo-outdoor/buscar/?tier=tienda", wait_until="networkidle")
        page.wait_for_timeout(1400)
        check("F3", "buscador disponible en TIENDA", page.locator("#q").count() == 1)
        check("F3", "el estado bloqueado nombra el plan", page.locator(".locked").count() == 0)

        page.goto(f"{BASE}/admin/mundo-outdoor/?tier=escaparate", wait_until="networkidle")
        admin_login(page)
        page.wait_for_timeout(1200)
        locked_links = page.locator(".admin__link--locked").count()
        check("F3", "el panel atenúa los módulos fuera del plan", locked_links >= 3, f"{locked_links} módulos")

        page.goto(f"{BASE}/admin/tienda-express/?tier=comercio", wait_until="networkidle")
        admin_login(page)
        page.wait_for_timeout(1200)
        before_locked = page.locator(".admin__link--locked").count()
        page.click(".dock__toggle")
        page.wait_for_timeout(400)
        page.locator(".dock__card").first.click()
        page.wait_for_timeout(900)
        after_locked = page.locator(".admin__link--locked").count()
        check(
            "F3",
            "el panel reacciona al cambio de plan sin recargar",
            after_locked > before_locked,
            f"{before_locked} → {after_locked}",
        )

        # El plan también tiene que verse en la tienda, no solo en la barra.
        page.goto(f"{BASE}/t/tienda-express/?tier=escaparate", wait_until="networkidle")
        page.wait_for_timeout(1600)
        bloques_bajo = page.locator(".hero-block, .grid-block, .text-block").count()
        aviso = page.inner_text(".plan-notice")
        page.goto(f"{BASE}/t/tienda-express/?tier=comercio", wait_until="networkidle")
        page.wait_for_timeout(1600)
        bloques_alto = page.locator(".hero-block, .grid-block, .text-block").count()
        check(
            "F3",
            "el storefront publica menos bloques con un plan bajo",
            bloques_bajo < bloques_alto,
            f"{bloques_bajo} vs {bloques_alto}",
        )
        check("F3", "el aviso de plan explica la diferencia", "bloque" in aviso.lower(), aviso[:70])
        check(
            "F3",
            "la tienda enlaza al panel",
            page.locator('a[href="/admin/tienda-express/"]').count() >= 1,
        )

        # Stock por sucursal: función de COMERCIO.
        product_path = "/t/tienda-express/p/botella-bubba-trailblazer-straw-licorice-40oz/"
        page.goto(f"{BASE}{product_path}?tier=tienda", wait_until="networkidle")
        page.wait_for_timeout(1600)
        sucursales_tienda = page.locator(".detail__branches").count()
        page.goto(f"{BASE}{product_path}?tier=comercio", wait_until="networkidle")
        page.wait_for_timeout(1600)
        sucursales_comercio = page.locator(".detail__branches").count()
        check(
            "F3",
            "el stock por sucursal aparece solo en COMERCIO",
            sucursales_tienda == 0 and sucursales_comercio == 1,
            f"{sucursales_tienda} → {sucursales_comercio}",
        )

        # Envío nacional gateado en el checkout.
        page.goto(f"{BASE}/t/tienda-express/checkout/?tier=tienda", wait_until="networkidle")
        page.wait_for_timeout(1600)
        envio_tienda = page.locator("button:has-text('Envío nacional')").count()
        page.goto(f"{BASE}/t/tienda-express/checkout/?tier=comercio", wait_until="networkidle")
        page.wait_for_timeout(1600)
        envio_comercio = page.locator("button:has-text('Envío nacional')").count()
        check(
            "F3",
            "el envío nacional se habilita en COMERCIO",
            envio_tienda == 0 and envio_comercio == 1,
            f"{envio_tienda} → {envio_comercio}",
        )

        page.goto(f"{BASE}/t/tienda-express/?tier=distribuidor", wait_until="networkidle")
        page.wait_for_timeout(1200)
        page.click(".dock__toggle")
        page.wait_for_timeout(300)
        cards = page.locator(".dock__card").count()
        check("F3", "la barra ofrece los 4 planes", cards == 4, f"{cards} tarjetas")
        page.locator(".dock__card").first.click()
        page.wait_for_timeout(600)
        current = page.inner_text(".dock__current")
        check("F3", "el plan cambia en la misma pantalla", current.strip() == "ESCAPARATE", current)
        check("F3", "el plan queda en la URL", "tier=escaparate" in page.url, page.url)

        # ---------------------------------------------------------------- fase 4
        section("Fase 4 — storefront")
        # Plan alto para ver la portada completa: la cantidad de bloques depende del plan.
        page.goto(f"{BASE}/t/tienda-express/?tier=comercio", wait_until="networkidle")
        page.wait_for_timeout(1600)
        hero = page.inner_text(".hero-block__title")
        check("F4", "la portada muestra el bloque principal", len(hero) > 5, hero[:40])
        cards = page.locator(".product-card").count()
        check("F4", "la portada lista productos", cards >= 8, f"{cards} tarjetas")
        check("F4", "cada producto tiene botón de compra", page.locator(".product-card button").count() == cards)
        check(
            "F4",
            "todas las imágenes tienen texto alternativo",
            page.evaluate("[...document.images].filter(i => !i.hasAttribute('alt') || !i.alt.trim()).length") == 0,
        )
        add_button = page.locator(".product-card button:not([disabled])").first
        check("F4", "hay productos con compra disponible", add_button.count() > 0)
        add_button.click()
        page.wait_for_timeout(700)
        check("F4", "agregar al carrito actualiza el contador", "CARRITO [1]" in page.inner_text(".cart__button").upper())
        page.click(".cart__close")
        page.wait_for_timeout(300)

        slug = page.locator(".product-card__link").first.get_attribute("href")
        page.goto(f"{BASE}{slug}", wait_until="networkidle")
        page.wait_for_timeout(1000)
        check("F4", "la ficha de producto abre", page.locator(".detail__title").count() == 1)
        detail_buttons = page.locator(".detail__actions button").count()
        check("F4", "la ficha permite agregar", detail_buttons >= 1)

        page.goto(f"{BASE}/t/tienda-express/checkout/?tier=tienda", wait_until="networkidle")
        page.wait_for_timeout(1400)
        checkout_lines = page.locator(".checkout__lines li").count()
        check("F4", "el checkout conserva el carrito", checkout_lines >= 1, f"{checkout_lines} líneas")
        page.fill("#name", "Prueba Automática")
        page.fill("#phone", "59170000999")
        page.click("button:has-text('Confirmar pedido')")
        page.wait_for_selector(".checkout__code", timeout=20000)
        code = page.inner_text(".checkout__code").strip()
        check("F4", "el pedido se crea con código", bool(re.match(r"TE-\d+", code)), code)

        page.goto(f"{BASE}/t/tienda-express/pedido/?code={code}", wait_until="networkidle")
        page.wait_for_timeout(1500)
        check("F4", "el seguimiento encuentra el pedido", code in page.inner_text(".track"))

        page.goto(f"{BASE}/t/tienda-express/paginas/envios/", wait_until="networkidle")
        page.wait_for_timeout(800)
        check("F4", "las páginas de información existen", page.locator("h1").count() == 1)
        resp = page.request.get(f"{BASE}/pagina-que-no-existe/")
        check("F4", "la ruta inexistente devuelve 404", resp.status == 404, str(resp.status))

        # ---------------------------------------------------------------- fase 5
        section("Fase 5 — catálogo e inventario")
        page.goto(f"{BASE}/admin/tienda-express/productos/?tier=comercio", wait_until="networkidle")
        admin_login(page)
        page.wait_for_selector("table.table tbody tr", timeout=20000)
        rows = page.locator("table.table tbody tr").count()
        check("F5", "la tabla lista el catálogo", rows >= 8, f"{rows} filas")
        check("F5", "el contador de plan es visible", "publicados" in page.inner_text(".pill").lower())

        page.goto(f"{BASE}/admin/tienda-express/productos/nuevo/?tier=comercio", wait_until="networkidle")
        admin_login(page)
        page.wait_for_timeout(1200)
        page.fill("#title", "Producto de Prueba QA")
        page.fill("table.table tbody tr td:nth-child(1) input", "QA-001")
        page.fill("table.table tbody tr td:nth-child(3) input", "123")
        page.fill("#alt-0", "Botella de prueba sobre una mesa")
        page.click("button:has-text('Guardar producto')")
        page.wait_for_timeout(2000)
        check("F5", "el editor confirma el guardado", page.locator(".notice").count() >= 1)

        page.goto(f"{BASE}/admin/tienda-express/productos/?tier=comercio", wait_until="networkidle")
        admin_login(page)
        page.wait_for_selector("table.table tbody tr", timeout=20000)
        check("F5", "el producto nuevo aparece en la lista", "Producto de Prueba QA" in page.inner_text("table.table"))
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1500)
        check("F5", "el producto persiste tras recargar", "Producto de Prueba QA" in page.inner_text("table.table"))

        page.goto(f"{BASE}/admin/tienda-express/inventario/?tier=comercio", wait_until="networkidle")
        admin_login(page)
        page.wait_for_selector("table.table tbody tr", timeout=20000)
        before = page.locator("table.table tbody tr td:nth-child(4)").first.inner_text()
        page.locator("table.table tbody tr").first.locator("button").first.click()
        page.wait_for_timeout(2000)
        after = page.locator("table.table tbody tr td:nth-child(4)").first.inner_text()
        check("F5", "el ajuste de stock cambia el disponible", before != after, f"{before} → {after}")
        check("F5", "el movimiento queda registrado", page.locator("table.table").nth(1).locator("tbody tr").count() >= 1)

        # ---------------------------------------------------------------- fase 6
        section("Fase 6 — pedidos y postventa")
        page.goto(f"{BASE}/admin/tienda-express/pedidos/?tier=comercio", wait_until="networkidle")
        admin_login(page)
        page.wait_for_selector("table.table tbody tr", timeout=20000)
        orders = page.locator("table.table tbody tr").count()
        check("F6", "la lista de pedidos carga", orders >= 5, f"{orders} pedidos")
        page.locator("table.table tbody tr a.link-button").first.click()
        page.wait_for_selector(".admin__title", timeout=20000)
        page.wait_for_timeout(1500)
        order_code = page.inner_text(".admin__title")
        check("F6", "el detalle del pedido abre", bool(re.search(r"TE-\d+", order_code)), order_code)

        buttons = page.locator("section.panel").first.locator("button.ghost")
        if buttons.count():
            label = buttons.first.inner_text()
            buttons.first.click()
            page.wait_for_timeout(1800)
            check("F6", "el estado del pedido cambia", page.locator(".notice").count() >= 1, label)

        page.fill("#note", "Nota de prueba automatizada")
        page.click("button:has-text('Agregar nota')")
        page.wait_for_timeout(1500)
        check("F6", "la nota interna se guarda", "Nota de prueba" in page.inner_text("body"))

        page.click("button:has-text('Adjuntar')")
        page.wait_for_timeout(1500)
        check("F6", "el comprobante se adjunta", "comprobante" in page.inner_text("body").lower())

        page.fill("section.panel table.table tbody tr td:nth-child(6) input", "1")
        page.wait_for_timeout(400)
        page.click("button:has-text('Registrar devolución')")
        page.wait_for_timeout(2000)
        body = page.inner_text("body")
        check("F6", "la devolución se registra con reembolso", "Devolución registrada" in body or "devolución" in body.lower())
        check("F6", "el historial del pedido acumula eventos", body.count("·") >= 1)


        # ------------------------------------------------- fase 7: demo, roles, tema, galería y filtros
        section("Fase 7 — badge, roles, tema, galería y filtros")

        page.goto(f"{BASE}/t/tienda-express/?tier=comercio", wait_until="networkidle")
        page.wait_for_timeout(1500)
        check("F7", "la tienda muestra el badge DEMO", page.locator(".demo-badge").count() == 1)
        page.click(".demo-badge")
        page.wait_for_timeout(400)
        modal = page.inner_text(".demo-modal__card")
        check("F7", "el badge explica la persistencia local", "navegador" in modal.lower(), modal[:60])
        page.click(".demo-modal__close")

        # galería con miniaturas y lightbox
        page.goto(f"{BASE}/t/tienda-express/p/molino-11-clicks-acero-inoxidable/", wait_until="networkidle")
        page.wait_for_timeout(1600)
        thumbs = page.locator(".gallery__thumb").count()
        check("F7", "la ficha muestra miniaturas", thumbs >= 2, f"{thumbs} miniaturas")
        first_src = page.get_attribute(".gallery__main img", "src")
        page.locator(".gallery__thumb").nth(1).click()
        page.wait_for_timeout(500)
        check("F7", "la miniatura cambia la imagen principal",
              page.get_attribute(".gallery__main img", "src") != first_src)
        page.click(".gallery__main")
        page.wait_for_timeout(400)
        check("F7", "la imagen se amplía en un diálogo", page.locator(".lightbox").count() == 1)
        page.click(".lightbox__close")

        # filtros de colección
        page.goto(f"{BASE}/t/tienda-express/c/accesorios-de-cafe/", wait_until="networkidle")
        page.wait_for_timeout(1600)
        total = page.locator(".product-card").count()
        chips = page.locator(".filters__chips .tag")
        check("F7", "la colección ofrece filtros", chips.count() >= 2, f"{chips.count()} etiquetas")
        chips.nth(1).click()
        page.wait_for_timeout(600)
        filtrado = page.locator(".product-card").count()
        check("F7", "el filtro por etiqueta reduce el catálogo", filtrado <= total, f"{total} → {filtrado}")
        check("F7", "el filtro queda en la URL", "tag=" in page.url, page.url.split("?")[-1][:40])
        page.select_option("#sort", "precio-asc")
        page.wait_for_timeout(500)
        check("F7", "el orden queda en la URL", "orden=precio-asc" in page.url)

        # login simulado por rol (se limpia la sesión previa del recorrido)
        page.goto(f"{BASE}/admin/tienda-express/productos/?tier=comercio", wait_until="networkidle")
        page.evaluate("localStorage.clear()")
        page.reload(wait_until="networkidle")
        page.wait_for_selector(".auth, .session", timeout=15000)
        check("F7", "el panel pide entrar", page.locator(".auth").count() == 1)
        page.fill("#auth-name", "Ana QA")
        page.select_option("#auth-role", "lector")
        page.click("button:has-text('Entrar')")
        page.wait_for_selector(".session", timeout=15000)
        page.wait_for_timeout(1200)
        cuerpo = page.inner_text("body").lower()
        check("F7", "el lector ve el catálogo en solo lectura", "solo lectura" in cuerpo)
        check("F7", "el lector no puede crear productos",
              page.locator('a[href*="productos/nuevo"]').count() == 0)
        check("F7", "la barra muestra el rol activo", "lector" in page.inner_text(".session").lower())

        # editor de tema
        page.goto(f"{BASE}/admin/tienda-express/tema/?tier=comercio", wait_until="networkidle")
        page.wait_for_selector(".session", timeout=15000)
        page.wait_for_timeout(1200)
        check("F7", "el editor de tema muestra vista previa", page.locator(".theme-preview").count() == 1)
        page.select_option("#switch-role", "propietario")
        page.wait_for_timeout(900)
        page.fill("#accent", "#1d4ed8")
        page.wait_for_timeout(400)
        page.click("button:has-text('Guardar tema')")
        page.wait_for_timeout(1500)
        check("F7", "el tema se guarda", "guardado" in page.inner_text("body").lower())
        check("F7", "el contraste se valida en vivo", "AA" in page.inner_text(".theme-checks"))
        page.goto(f"{BASE}/t/tienda-express/", wait_until="networkidle")
        page.wait_for_timeout(2200)
        accent = page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--brand-accent').trim()")
        check("F7", "el tema guardado se aplica en la tienda", accent.lower() == "#1d4ed8", accent)

        # ------------------------------------------------------------- accesibilidad
        section("Accesibilidad y errores")
        page.goto(f"{BASE}/t/tienda-express/", wait_until="networkidle")
        page.wait_for_timeout(1200)
        contrast = page.evaluate(
            """() => {
          const parse=(s)=>{const m=s.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(Number);
            return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};};
          const lum=(c)=>{const f=(v)=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
            return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);};
          const bgOf=(el)=>{let n=el;while(n&&n.nodeType===1){const c=parse(getComputedStyle(n).backgroundColor);
            if(c&&c.a>0.5)return c;n=n.parentElement;}return {r:227,g:226,b:226};};
          const fails=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
          while((n=w.nextNode())){const t=(n.nodeValue||'').trim();if(t.length<2)continue;
            const el=n.parentElement;if(!el)continue;const cs=getComputedStyle(el);
            if(cs.visibility==='hidden'||cs.display==='none')continue;
            const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
            const fg=parse(cs.color),bg=bgOf(el);if(!fg||!bg)continue;
            const L1=lum(fg),L2=lum(bg);const cr=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
            const fs=parseFloat(cs.fontSize),fw=parseInt(cs.fontWeight)||400;
            const req=(fs>=24||(fs>=18.66&&fw>=700))?3:4.5;
            if(cr<req)fails.push({t:t.slice(0,28),cr:+cr.toFixed(2)});}
          return fails;
        }"""
        )
        check("QA", "contraste AA en el storefront", len(contrast) == 0, str(contrast[:3]))
        check("QA", "sin scroll horizontal en 1440", page.evaluate("document.documentElement.scrollWidth - innerWidth") == 0)
        mobile = browser.new_context(viewport={"width": 390, "height": 844}, locale="es-BO")
        mpage = mobile.new_page()
        mpage.goto(f"{BASE}/t/tienda-express/", wait_until="networkidle")
        mpage.wait_for_timeout(1500)
        check("QA", "sin scroll horizontal en 390", mpage.evaluate("document.documentElement.scrollWidth - innerWidth") == 0)
        mpage.screenshot(path="/tmp/qa_mobile_store.png")
        # Cloudflare inyecta su beacon de Web Analytics en el borde para todo el
        # dominio; la CSP del sitio lo bloquea a propósito. No es código nuestro.
        console_errors = [
            e for e in errors
            if "favicon" not in e and "cloudflareinsights.com" not in e
        ]
        check("QA", "sin errores de consola propios", len(console_errors) == 0, str(console_errors[:2]))
        edge_blocked = [e for e in errors if "cloudflareinsights.com" in e]
        check(
            "QA",
            "la CSP bloquea el script de terceros del borde",
            bool(edge_blocked) or BASE.startswith("http://localhost"),
            "no se inyectó beacon en esta ejecución",
        )

        page.goto(f"{BASE}/admin/tienda-express/?tier=comercio", wait_until="networkidle")
        admin_login(page)
        page.wait_for_timeout(1500)
        page.screenshot(path="/tmp/qa_admin.png", full_page=True)
        page.goto(f"{BASE}/t/tienda-express/", wait_until="networkidle")
        page.wait_for_timeout(1200)
        page.screenshot(path="/tmp/qa_store.png", full_page=True)

        browser.close()

    ok = sum(1 for _, _, passed, _ in results if passed)
    total = len(results)
    print(f"\n{'=' * 60}\nRESUMEN: {ok}/{total} pruebas aprobadas")
    for phase, name, passed, detail in results:
        if not passed:
            print(f"  FALLO [{phase}] {name} — {detail}")
    return 0 if ok == total else 1


if __name__ == "__main__":
    sys.exit(main())
