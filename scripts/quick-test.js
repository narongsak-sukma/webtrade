const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log console
  page.on('console', msg => console.log(`[Console]: ${msg.text()}`));

  // Go to login
  await page.goto('http://localhost:3030/login');

  // Fill form
  await page.fill('input[type="email"]', 'admin@tradingweb.com');
  await page.fill('input[type="password"]', 'admin123');

  // Submit
  await page.click('button[type="submit"]');

  // Wait for navigation or timeout
  try {
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('✅ SUCCESS: Redirected to dashboard!');
  } catch (e) {
    console.log('❌ FAIL: Did not redirect to dashboard');
    console.log('Current URL:', page.url());
  }

  // Check localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  console.log('Token in storage:', token ? '✓ YES' : '✗ NO');

  await browser.close();
})();
