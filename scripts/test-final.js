const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  // Log ALL console messages
  page.on('console', msg => {
    console.log(`[Browser Console]: ${msg.text()}`);
  });

  // Intercept and log API responses
  page.on('response', async res => {
    if (res.url().includes('/api/auth/login')) {
      const status = res.status();
      const body = await res.text();
      console.log(`\n[API RESPONSE] Status: ${status}`);
      console.log(`[API RESPONSE] Body: ${body.substring(0, 200)}\n`);
    }
  });

  console.log('Navigating to login...');
  await page.goto('http://localhost:3030/login');

  console.log('Filling credentials...');
  await page.fill('input[name="email"]', 'admin@tradingweb.com');
  await page.fill('input[name="password"]', 'admin123');

  console.log('Submitting form...');
  await page.click('button[type="submit"]');

  console.log('Waiting up to 10 seconds for redirect...');
  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ SUCCESS! Redirected to dashboard');
    console.log('URL:', page.url());
  } catch (e) {
    console.log('❌ FAIL - Did not redirect');
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());

    // Check localStorage
    const storage = await page.evaluate(() => ({
      token: localStorage.getItem('auth_token'),
      user: localStorage.getItem('user')
    }));
    console.log('Token in storage:', storage.token ? 'YES' : 'NO');
    console.log('User in storage:', storage.user ? 'YES' : 'NO');
  }

  console.log('Keeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
})();
