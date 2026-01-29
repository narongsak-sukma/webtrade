const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture ALL console output
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text) logs.push(text);
  });

  // Go to login
  await page.goto('http://localhost:3030/login');

  // Fill and submit
  await page.fill('input[name="email"]', 'admin@tradingweb.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Wait
  await page.waitForTimeout(3000);

  // Check results
  const url = page.url();
  const storage = await page.evaluate(() => ({
    token: localStorage.getItem('auth_token'),
    user: localStorage.getItem('user')
  }));

  console.log('\n========== FINAL RESULTS ==========');
  console.log('Final URL:', url);
  console.log('Token in storage:', storage.token ? 'YES' : 'NO');
  console.log('User in storage:', storage.user ? 'YES' : 'NO');
  console.log('Login successful?', url.includes('/dashboard') ? 'YES ✅' : 'NO ❌');

  if (logs.length > 0) {
    console.log('\n========== BROWSER CONSOLE ==========');
    logs.forEach(log => console.log(log));
  } else {
    console.log('\n========== BROWSER CONSOLE ==========');
    console.log('(No console output)');
  }

  await browser.close();
})();
