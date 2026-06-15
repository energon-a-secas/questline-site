from playwright.sync_api import sync_playwright
import os

url = 'http://localhost:8832/#sites'
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

    # Verify the Sites tab is active and the group filter chips render.
    page.locator('[data-site-group="all"]').wait_for(state='visible')
    page.locator('[data-site-group="engineering"]').wait_for(state='visible')
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(out_dir, 'sites-landing.png'), full_page=True)
    print('Saved scripts/.verify/sites-landing.png')

    # Select a site and verify the detail panel appears.
    page.locator('[data-site="github"]').click()
    page.wait_for_timeout(300)
    detail = page.locator('#sitesDetail')
    assert detail.is_visible(), 'Sites detail panel should be visible'
    assert detail.locator('text=Open site').is_visible(), 'Open site button should be visible'
    page.screenshot(path=os.path.join(out_dir, 'sites-detail.png'), full_page=True)
    print('Saved scripts/.verify/sites-detail.png')

    # Search for a site.
    page.locator('#sitesSearch').fill('figma')
    page.wait_for_timeout(400)
    visible_rows = page.locator('[data-site]').all()
    assert len(visible_rows) == 1, 'Search should narrow to one site (Figma)'
    page.screenshot(path=os.path.join(out_dir, 'sites-search.png'), full_page=True)
    print('Saved scripts/.verify/sites-search.png')

    # Clear search and filter by the Engineering group.
    page.locator('#sitesSearch').fill('')
    page.wait_for_timeout(300)
    page.locator('[data-site-group="engineering"]').click()
    page.wait_for_timeout(300)
    engineering_rows = page.locator('[data-site]').all()
    assert len(engineering_rows) > 0, 'Engineering group should show sites'
    page.screenshot(path=os.path.join(out_dir, 'sites-engineering.png'), full_page=True)
    print('Saved scripts/.verify/sites-engineering.png')

    browser.close()
