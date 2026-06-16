from playwright.sync_api import sync_playwright
import os

url = 'http://localhost:8832/#atlas'
out_dir = 'scripts/.verify'
os.makedirs(out_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    # Skip splash, coach, and daily dispatch.
    page.context.add_init_script("""
        localStorage.setItem('questline-splash', 'off');
        localStorage.setItem('questline-coached-v1', '1');
        const e = JSON.parse(localStorage.getItem('questline-engagement') || '{}');
        e.dispatchShownDate = new Date().toLocaleDateString('en-CA');
        localStorage.setItem('questline-engagement', JSON.stringify(e));
    """)
    page.goto(url, wait_until='networkidle')
    page.wait_for_timeout(500)

    # Verify the Atlas shell renders with topology map visible.
    assert page.locator('.catlas__map').count() > 0, 'Atlas map not rendered'
    page.screenshot(path=os.path.join(out_dir, 'atlas-map.png'), full_page=True)
    print('Saved scripts/.verify/atlas-map.png')

    # Switch to matrix view.
    page.locator('[data-atlas-view="matrix"]').click()
    page.wait_for_timeout(300)
    assert page.locator('.catlas__matrix').count() > 0, 'Atlas matrix not rendered'
    page.screenshot(path=os.path.join(out_dir, 'atlas-matrix.png'), full_page=True)
    print('Saved scripts/.verify/atlas-matrix.png')

    # Switch to upload view.
    page.locator('[data-atlas-view="upload"]').click()
    page.wait_for_timeout(300)
    assert page.locator('#atlasDropzone').count() > 0, 'Atlas upload not rendered'
    page.screenshot(path=os.path.join(out_dir, 'atlas-upload.png'), full_page=True)
    print('Saved scripts/.verify/atlas-upload.png')

    # Test a valid JSON upload via file picker.
    example = os.path.join(out_dir, 'questline-atlas-test.json')
    with open(example, 'w') as f:
        f.write('''{"teams":[{"id":"test-stream","name":"Test Stream","topology":"stream-aligned","needs":["checkout"],"edges":[]}]}''')
    page.locator('#atlasFile').set_input_files(example)
    page.wait_for_timeout(500)
    result = page.locator('.catlas__result-box')
    assert result.count() > 0, 'Upload result not shown'
    assert 'success' in result.first.get_attribute('class'), 'Upload did not validate successfully'
    page.screenshot(path=os.path.join(out_dir, 'atlas-upload-success.png'), full_page=True)
    print('Saved scripts/.verify/atlas-upload-success.png')

    browser.close()
