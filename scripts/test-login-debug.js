const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[Browser Console ${type}]:`, text);
  });

  // Listen for navigation events
  page.on('framenavigated', frame => {
    console.log(`[Navigation]: ${frame.url()}`);
  });

  console.log('🔵 Navigating to login page...');
  await page.goto('http://localhost:3030/login', { waitUntil: 'networkidle' });

  console.log('🔵 Page URL:', page.url());

  console.log('🔵 Filling login form...');
  await page.fill('input[type="email"]', 'admin@tradingweb.com');
  await page.fill('input[type="password"]', 'admin123');

  console.log('🔵 Submitting form...');
  await page.click('button[type="submit"]');

  // Wait to see what happens
  console.log('⏳ Waiting 5 seconds to observe behavior...');
  await page.waitForTimeout(5000);

  console.log('🔵 Final URL:', page.url());
  console.log('🔵 Page title:', await page.title());

  // Check localStorage
  const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
  const user = await page.evaluate(() => localStorage.getItem('user'));

  console.log('🔵 auth_token in localStorage:', authToken ? '✓ Present' : '✗ Missing');
  console.log('🔵 user in localStorage:', user ? '✓ Present' : '✗ Missing');

  if (authToken) {
    console.log('🔵 Token preview:', authToken.substring(0, 50) + '...');
  }

  console.log('📸 Taking screenshot...');
  await page.screenshot({ path: 'login-test-screenshot.png', fullPage: true });

  console.log('⏳ Keeping browser open for 5 more seconds for manual inspection...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('✅ Test complete');
})();
