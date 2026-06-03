const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('console', msg => console.log('console', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('pageerror', err.message));
  await page.goto('http://127.0.0.1:5176/login', { waitUntil: 'networkidle', timeout: 30000 });
  console.log(await page.locator('body').innerText().catch(e=>'ERR '+e.message));
  await page.screenshot({ path: 'docs/ui-screenshots/test-preview.png', fullPage: false });
  await browser.close();
})();
