from playwright.sync_api import sync_playwright
import os

url = 'http://localhost:8832/#intel/product-outcome'
out_dir = 'scripts/.verify'
os.makedirs(out_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.context.add_init_script("""
        localStorage.setItem('questline-splash', 'off');
        localStorage.setItem('questline-coached-v1', '1');
        const e = JSON.parse(localStorage.getItem('questline-engagement') || '{}');
        e.dispatchShownDate = new Date().toLocaleDateString('en-CA');
        localStorage.setItem('questline-engagement', JSON.stringify(e));
    """)
    page.goto(url, wait_until='networkidle')
    page.wait_for_timeout(500)
    page.screenshot(path=os.path.join(out_dir, 'intel-product.png'), full_page=True)
    print('Saved scripts/.verify/intel-product.png')

    # Switch to product scope filter.
    page.locator('[data-intel-scope="product"]').click()
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(out_dir, 'intel-product-scope.png'), full_page=True)
    print('Saved scripts/.verify/intel-product-scope.png')

    browser.close()
