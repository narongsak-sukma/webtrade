const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    // Set timeout longer
  });

  const page = await browser.newPage();

  // Log ALL console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text && text.length > 0) {
      console.log(`[Console ${type}]: ${text.substring(0, 200)}`);
    }
  });

  // Log all requests
  page.on('request', req => {
    const url = req.url();
    if (url.includes('login') || url.includes('_next')) {
      console.log(`[REQ]: ${req.method()} ${url}`);
    }
  });

  // Log responses
  page.on('response', res => {
    const url = res.url();
    const status = res.status();
    if (status !== 200 && (url.includes('login') || url.includes('_next'))) {
      console.log(`[RES ${status}]: ${url}`);
    }
  });

  console.log('\n========== STEP 1: Navigate to login ==========');
  await page.goto('http://localhost:3030/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('\n========== STEP 2: Fill form ==========');
  const emailInput = await page.locator('input[name="email"]');
  const passInput = await page.locator('input[name="password"]');

  const emailCount = await emailInput.count();
  const passCount = await passInput.count();

  console.log(`Email inputs found: ${emailCount}`);
  console.log(`Password inputs found: ${passCount}`);

  if (emailCount > 0) {
    await emailInput.fill('admin@tradingweb.com');
    console.log('Filled email');
  }

  if (passCount > 0) {
    await passInput.fill('admin123');
    console.log('Filled password');
  }

  console.log('\n========== STEP 3: Submit form ==========');
  const button = await page.locator('button[type="submit"]');
  const buttonCount = await button.count();
  console.log(`Submit buttons found: ${buttonCount}`);

  if (buttonCount > 0) {
    await button.click();
    console.log('Clicked submit button');
  }

  console.log('\n========== STEP 4: Wait for result ==========');
  await page.waitForTimeout(5000);

  console.log('\n========== STEP 5: Check result ==========');
  const finalUrl = page.url();
  const title = await page.title();

  console.log(`Final URL: ${finalUrl}`);
  console.log(`Page title: ${title}`);

  // Check localStorage
  const hasToken = await page.evaluate(() => {
    return !!localStorage.getItem('auth_token');
  });

  console.log(`Token in localStorage: ${hasToken ? 'YES ✅' : 'NO ❌'}`);

  if (finalUrl.includes('/dashboard')) {
    console.log('\n✅ SUCCESS: Login and redirect worked!');
  } else {
    console.log('\n❌ FAIL: Did not redirect to dashboard');
  }

  await browser.close();
})();
