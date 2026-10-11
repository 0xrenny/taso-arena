"""Headless duman testi: sayfa yüklenir, konsol hatası yok, tam bir maç oynanır."""
import asyncio, sys, os
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173/"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/workspace/taso-shots"
CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
os.makedirs(OUT, exist_ok=True)

async def run(p, name, vp, mobile):
    b = await p.chromium.launch(executable_path=CHROME if os.path.exists(CHROME) else None)
    ctx = await b.new_context(viewport=vp, is_mobile=mobile, has_touch=mobile, device_scale_factor=2 if mobile else 1)
    pg = await ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
    await pg.goto(URL, wait_until="networkidle")
    assert await pg.title() != ""
    await pg.wait_for_selector(".starter-pick")
    await pg.screenshot(path=f"{OUT}/{name}-1-starter.png")
    await pg.click(".starter-pick[data-id=kivilcik]")
    await pg.wait_for_selector(".slammer-card")
    # paket aç
    await pg.click("[data-act=openPack]")
    await pg.wait_for_selector("#packInfo:not(.hidden)", timeout=5000)
    await pg.screenshot(path=f"{OUT}/{name}-2-pack.png")
    await pg.click(".modal [data-act=closeModal]")
    await pg.screenshot(path=f"{OUT}/{name}-3-home.png", full_page=True)
    # arena
    await pg.click("nav [data-screen=arena]")
    await pg.wait_for_selector(".opp")
    await pg.click(".opp [data-act=challenge] >> nth=0")
    await pg.wait_for_selector(".battle")
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=f"{OUT}/{name}-4-battle.png")
    shot_mid = False
    for _ in range(40):
        if await pg.locator(".result-modal").count():
            break
        btn = pg.locator("#hitBtn")
        if await btn.count() and await btn.is_enabled():
            await pg.wait_for_timeout(300)
            await btn.click()
            if not shot_mid:
                await pg.wait_for_timeout(450)
                await pg.screenshot(path=f"{OUT}/{name}-5-hit.png")
                shot_mid = True
        await pg.wait_for_timeout(500)
    await pg.wait_for_selector(".result-modal", timeout=15000)
    await pg.screenshot(path=f"{OUT}/{name}-6-result.png")
    title = await pg.inner_text(".res-title")
    await pg.click(".modal [data-act=closeModal]")
    await pg.click("nav [data-screen=album]")
    await pg.wait_for_selector(".grid .slot")
    slots = await pg.locator(".grid .slot").count()
    await pg.screenshot(path=f"{OUT}/{name}-7-album.png", full_page=True)
    await pg.click("nav [data-screen=ranking]")
    await pg.wait_for_selector("tr.me")
    await pg.screenshot(path=f"{OUT}/{name}-8-ranking.png", full_page=True)
    saved = await pg.evaluate("JSON.parse(localStorage.getItem('taso-arena-save-v1')).stats.matches")
    # yeniden yükle: ilerleme korunur
    await pg.reload(wait_until="networkidle")
    await pg.wait_for_selector(".slammer-card")
    await b.close()
    print(f"[{name}] sonuç={title!r} albüm_slot={slots} kayıtlı_maç={saved} hatalar={errs}")
    return errs

async def main():
    async with async_playwright() as p:
        e1 = await run(p, "mobile", {"width": 390, "height": 844}, True)
        e2 = await run(p, "desktop", {"width": 1280, "height": 900}, False)
    if e1 or e2:
        print("KONSOL HATALARI VAR"); sys.exit(1)
    print("SMOKE OK")

asyncio.run(main())
