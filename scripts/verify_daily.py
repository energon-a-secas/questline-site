from playwright.sync_api import sync_playwright
import os

url = 'http://localhost:8832/'
out_dir = 'scripts/.verify'
os.makedirs(out_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1280, 'height': 900})

    # Skip splash/coach and clear any prior dispatch shown date so it auto-opens.
    page.context.add_init_script("""
        localStorage.setItem('questline-splash', 'off');
        localStorage.setItem('questline-coached-v1', '1');
        const e = JSON.parse(localStorage.getItem('questline-engagement') || '{}');
        e.dispatchShownDate = null;
        e.dispatchDismissed = [];
        e.dispatchSnooze = null;
        localStorage.setItem('questline-engagement', JSON.stringify(e));
    """)
    page.goto(url, wait_until='networkidle')
    page.wait_for_timeout(800)
    page.screenshot(path=os.path.join(out_dir, 'daily-auto-open.png'), full_page=True)
    print('Saved daily-auto-open.png')

    # Click the next dot.
    dot = page.locator('[data-daily-dot="1"]').first
    if dot.count():
        dot.click()
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(out_dir, 'daily-second-slide.png'), full_page=True)
        print('Saved daily-second-slide.png')

    # Dismiss the modal via the Got it button and check the bell dot.
    page.locator('.daily__foot button[data-daily-close]').click()
    page.wait_for_timeout(200)
    page.screenshot(path=os.path.join(out_dir, 'daily-closed.png'), full_page=True)
    print('Saved daily-closed.png')

    # Reopen via bell.
    page.locator('#openDaily').click()
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(out_dir, 'daily-reopened.png'), full_page=True)
    print('Saved daily-reopened.png')

    # Dismiss one item and verify the carousel updates.
    page.locator('[data-daily-dismiss]').click()
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(out_dir, 'daily-dismissed-item.png'), full_page=True)
    print('Saved daily-dismissed-item.png')

    browser.close()
