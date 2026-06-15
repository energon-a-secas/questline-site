from playwright.sync_api import sync_playwright
import os

url = 'http://localhost:8832/#profile'
out_dir = 'scripts/.verify'
os.makedirs(out_dir, exist_ok=True)

viewports = [
    ('mobile', 375, 812),
    ('tablet', 768, 1024),
    ('desktop', 1280, 900),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    # Skip the boot splash, first-run coach, and daily dispatch on repeated runs.
    page.context.add_init_script("""
        localStorage.setItem('questline-splash', 'off');
        localStorage.setItem('questline-coached-v1', '1');
        const e = JSON.parse(localStorage.getItem('questline-engagement') || '{}');
        e.dispatchShownDate = new Date().toISOString().slice(0, 10);
        localStorage.setItem('questline-engagement', JSON.stringify(e));
    """)
    page.goto(url, wait_until='networkidle')
    page.wait_for_timeout(500)

    first_class = page.locator('[data-class]').first
    if first_class.count():
        first_class.click()
        page.wait_for_timeout(300)

    for name, w, h in viewports:
        page.set_viewport_size({'width': w, 'height': h})
        page.wait_for_timeout(200)
        path = os.path.join(out_dir, f'profile-{name}.png')
        page.screenshot(path=path, full_page=True)
        print(f'Saved {path}')

    # Verify the edit form opens for the first cert.
    page.set_viewport_size({'width': 1280, 'height': 900})
    first_edit = page.locator('[data-cred-edit]').first
    first_edit.click()
    page.wait_for_timeout(300)
    form_path = os.path.join(out_dir, 'profile-edit-form.png')
    page.screenshot(path=form_path, full_page=True)
    print(f'Saved {form_path}')

    browser.close()
