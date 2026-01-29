const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  // Log all console messages
  page.on('console', msg => {
    console.log(`[Console]: ${msg.text()}`);
  });

  // Log all network requests
  page.on('request', request => {
    console.log(`[Request]: ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 || url.includes('_next') || url.includes('login')) {
      console.log(`[Response ${status}]: ${url}`);
    }
  });

  console.log('🔵 Navigating to login page...');
  await page.goto('http://localhost:3030/login', { waitUntil: 'networkidle' });

  console.log('🔵 Filling form...');
  await page.fill('input[name="email"]', 'admin@tradingweb.com');
  await page.fill('input[name="password"]', 'admin123');

  console.log('🔵 Submitting form...');
  await page.click('button[type="submit"]');

  console.log('⏳ Waiting up to 10 seconds for navigation...');
  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ SUCCESS: Redirected to dashboard!');
    console.log('Final URL:', page.url());
  } catch (e) {
    console.log('❌ FAIL: Did not redirect to dashboard');
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
  }

  // Wait for manual inspection
  console.log('⏳ Keeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);

  await browser.close();
})();
