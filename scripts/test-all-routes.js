/**
 * Playwright Route Testing Script
 * Tests all routes in the application
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3030';

const routes = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/admin',
  '/admin/monitoring',
  '/signals/history',
  '/watchlists',
  '/api/health',
  '/api/stocks',
  '/api/signals',
  '/api/jobs',
  '/api/watchlists',
];

async function testAllRoutes() {
  console.log('🚀 Starting Playwright Route Testing...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 500 // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  const results = {
    passed: [],
    failed: [],
    errors: []
  };

  try {
    // Test 1: Homepage redirect
    console.log('📍 Testing: Homepage (/)');
    try {
      await page.goto(BASE_URL + '/');
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      console.log('  ✅ Homepage redirects to dashboard\n');
      results.passed.push('Homepage redirect');
    } catch (error) {
      console.log('  ❌ Homepage redirect failed:', error.message);
      results.failed.push('Homepage redirect');
      results.errors.push({ route: '/', error: error.message });
    }

    // Test 2: Login page
    console.log('📍 Testing: Login Page');
    try {
      await page.goto(BASE_URL + '/login');
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      console.log('  ✅ Login page loaded\n');
      results.passed.push('Login page');
    } catch (error) {
      console.log('  ❌ Login page failed:', error.message);
      results.failed.push('Login page');
      results.errors.push({ route: '/login', error: error.message });
    }

    // Test 3: Admin Login and Dashboard
    console.log('📍 Testing: Admin Login Flow');
    try {
      await page.goto(BASE_URL + '/login');

      // Fill in login form
      await page.fill('input[type="email"]', 'admin@tradingweb.com');
      await page.fill('input[type="password"]', 'admin123');

      // Submit login
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 5000 });
      console.log('  ✅ Login successful, redirected to dashboard');

      // Check dashboard content
      const dashboardTitle = await page.textContent('h1');
      console.log('  ✅ Dashboard loaded:', dashboardTitle);
      console.log();

      results.passed.push('Admin login flow');
    } catch (error) {
      console.log('  ❌ Admin login failed:', error.message);
      console.log();
      results.failed.push('Admin login');
      results.errors.push({ route: 'login', error: error.message });
    }

    // Test 4: Admin Panel
    console.log('📍 Testing: Admin Panel');
    try {
      await page.goto(BASE_URL + '/admin');
      const title = await page.textContent('h1');
      console.log('  ✅ Admin panel loaded:', title);
      console.log();
      results.passed.push('Admin panel');
    } catch (error) {
      console.log('  ❌ Admin panel failed:', error.message);
      console.log();
      results.failed.push('Admin panel');
      results.errors.push({ route: '/admin', error: error.message });
    }

    // Test 5: Admin Monitoring
    console.log('📍 Testing: Admin Monitoring');
    try {
      await page.goto(BASE_URL + '/admin/monitoring');
      const title = await page.textContent('h1, h2').then(text => text.substring(0, 50));
      console.log('  ✅ Monitoring loaded:', title);
      console.log();
      results.passed.push('Admin monitoring');
    } catch (error) {
      console.log('  ❌ Monitoring failed:', error.message);
      console.log();
      results.failed.push('Admin monitoring');
      results.errors.push({ route: '/admin/monitoring', error: error.message });
    }

    // Test 6: Signal History
    console.log('📍 Testing: Signal History');
    try {
      await page.goto(BASE_URL + '/signals/history');
      const title = await page.textContent('h1, h2').then(text => text.substring(0, 50));
      console.log('  ✅ Signal history loaded:', title);
      console.log();
      results.passed.push('Signal history');
    } catch (error) {
      console.log('  ❌ Signal history failed:', error.message);
      console.log();
      results.failed.push('Signal history');
      results.errors.push({ route: '/signals/history', error: error.message });
    }

    // Test 7: Watchlists
    console.log('📍 Testing: Watchlists');
    try {
      await page.goto(BASE_URL + '/watchlists');
      const title = await page.textContent('h1, h2').then(text => text.substring(0, 50));
      console.log('  ✅ Watchlists loaded:', title);
      console.log();
      results.passed.push('Watchlists');
    } catch (error) {
      console.log('  ❌ Watchlists failed:', error.message);
      console.log();
      results.failed.push('Watchlists');
      results.errors.push({ route: '/watchlists', error: error.message });
    }

    // Test 8: API Endpoints (via fetch)
    console.log('📍 Testing: API Endpoints');
    const apiTests = [
      { name: 'Health API', url: '/api/health' },
      { name: 'Stocks API', url: '/api/stocks' },
      { name: 'Signals API', url: '/api/signals' },
      { name: 'Jobs API', url: '/api/jobs' },
    ];

    for (const api of apiTests) {
      try {
        const response = await page.request.get(BASE_URL + api.url);
        if (response.ok()) {
          console.log(`  ✅ ${api.name}: ${response.status()}`);
          results.passed.push(api.name);
        } else {
          console.log(`  ❌ ${api.name}: ${response.status()}`);
          results.failed.push(api.name);
        }
      } catch (error) {
        console.log(`  ❌ ${api.name}:`, error.message);
        results.failed.push(api.name);
        results.errors.push({ route: api.url, error: error.message });
      }
    }
    console.log();

    // Take a screenshot of the dashboard
    console.log('📸 Taking screenshot of dashboard...');
    await page.screenshot({
      path: 'test-results/dashboard-screenshot.png',
      fullPage: true
    });
    console.log('  ✅ Screenshot saved to test-results/dashboard-screenshot.png\n');

  } catch (error) {
    console.error('❌ Fatal error during testing:', error);
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('═══════════════════════════════════════');
  console.log('          TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`Total:   ${results.passed.length + results.failed.length}`);
  console.log('');

  if (results.errors.length > 0) {
    console.log('ERRORS:');
    results.errors.forEach((err, index) => {
      console.log(`  ${index + 1}. ${err.route}: ${err.error}`);
    });
  }

  console.log('═══════════════════════════════════════');

  return results;
}

testAllRoutes().catch(console.error);
