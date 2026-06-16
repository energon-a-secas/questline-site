from playwright.sync_api import sync_playwright
import os

url = 'http://localhost:8832/#playbooks'
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

    # Select the product brief playbook.
    pb = page.locator('[data-playbook="product-brief"]')
    assert pb.count() > 0, 'Product brief playbook not found'
    pb.click()
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(out_dir, 'playbook-product-brief.png'), full_page=True)
    print('Saved scripts/.verify/playbook-product-brief.png')

    browser.close()
