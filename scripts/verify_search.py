from playwright.sync_api import sync_playwright
import os

url = 'http://localhost:8832/#brief'
out_dir = 'scripts/.verify'
os.makedirs(out_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.context.add_init_script("""
        localStorage.setItem('questline-splash', 'off');
        localStorage.setItem('questline-coached-v1', '1');
        const e = JSON.parse(localStorage.getItem('questline-engagement') || '{}');
        e.dispatchShownDate = new Date().toISOString().slice(0, 10);
        localStorage.setItem('questline-engagement', JSON.stringify(e));
    """)
    page.goto(url, wait_until='networkidle')
    page.wait_for_timeout(500)

    page.keyboard.press('/')
    page.wait_for_timeout(300)
    page.locator('#siteSearchInput').fill('team topology')
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(out_dir, 'search-team-topology.png'), full_page=True)
    print('Saved scripts/.verify/search-team-topology.png')

    page.locator('#siteSearchInput').fill('customer need')
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(out_dir, 'search-customer-need.png'), full_page=True)
    print('Saved scripts/.verify/search-customer-need.png')

    browser.close()
