import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

SESSION_DIR = Path("session")

async def main():
    SESSION_DIR.mkdir(exist_ok=True)

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=str(SESSION_DIR),
            headless=False,
            viewport={"width": 1400, "height": 900},
            args=["--start-maximized"],
        )

        page = context.pages[0] if context.pages else await context.new_page()
        await page.goto("https://www.facebook.com/", wait_until="domcontentloaded")

        print("Connecte-toi complètement à Facebook.")
        print("Attends que la page d’accueil soit entièrement chargée.")
        input("Quand c’est bon, appuie sur Entrée...")

        await page.wait_for_timeout(10000)
        await page.screenshot(path="login_saved.png", full_page=True)

        print("Session sauvegardée.")
        await context.close()

asyncio.run(main())