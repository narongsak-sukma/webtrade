const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  // Log all network requests
  page.on('request', request => {
    console.log(`[Request]: ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      console.log(`[Response ${status}]: ${response.url()}`);
    }
  });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:3030/login');

  // Wait a bit for all requests to complete
  await page.waitForTimeout(3000);

  await browser.close();
})();
