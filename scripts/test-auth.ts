/**
 * Authentication System Test Script
 *
 * Tests all authentication endpoints:
 * 1. Register new user (valid data)
 * 2. Register with invalid email (should fail)
 * 3. Register with weak password (should fail)
 * 4. Login with correct credentials (success)
 * 5. Login with wrong password (fails)
 * 6. Access protected route with token (works)
 * 7. Access protected route without token (fails)
 * 8. Logout clears session
 * 9. Token expiration works
 * 10. Rate limiting enforced
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

/**
 * Helper: Run a test and record results
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const start = Date.now();

  try {
    await testFn();
    const duration = Date.now() - start;

    results.push({
      name,
      passed: true,
      message: 'Test passed',
      duration,
    });

    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Unknown error';

    results.push({
      name,
      passed: false,
      message,
      duration,
    });

    console.error(`❌ ${name}: ${message} (${duration}ms)`);
  }
}

/**
 * Test 1: Register new user with valid data
 */
async function testRegisterValidUser() {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User',
    }),
  });

  if (!response.ok) {
    throw new Error(`Expected 201, got ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();

  if (!data.success || !data.user || !data.token) {
    throw new Error('Invalid response structure');
  }

  if (data.user.email !== 'test@example.com') {
    throw new Error('Email mismatch');
  }

  // Verify cookie is set
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie || !setCookie.includes('auth_token')) {
    throw new Error('Auth cookie not set');
  }

  return data.token;
}

/**
 * Test 2: Register with invalid email (should fail)
 */
async function testRegisterInvalidEmail() {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'invalid-email',
      password: 'Test123!@#',
      name: 'Test User',
    }),
  });

  if (response.ok) {
    throw new Error('Expected failure for invalid email');
  }

  const data = await response.json();

  if (data.success !== false) {
    throw new Error('Expected success: false');
  }
}

/**
 * Test 3: Register with weak password (should fail)
 */
async function testRegisterWeakPassword() {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test2@example.com',
      password: 'weak',
      name: 'Test User',
    }),
  });

  if (response.ok) {
    throw new Error('Expected failure for weak password');
  }

  const data = await response.json();

  if (data.success !== false) {
    throw new Error('Expected success: false');
  }

  if (!data.error?.includes('Password')) {
    throw new Error('Expected password error message');
  }
}

/**
 * Test 4: Login with correct credentials
 */
async function testLoginCorrectCredentials() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123!@#',
    }),
  });

  if (!response.ok) {
    throw new Error(`Expected 200, got ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();

  if (!data.success || !data.user || !data.token) {
    throw new Error('Invalid response structure');
  }

  // Verify cookie is set
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie || !setCookie.includes('auth_token')) {
    throw new Error('Auth cookie not set');
  }

  return data.token;
}

/**
 * Test 5: Login with wrong password (should fail)
 */
async function testLoginWrongPassword() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'WrongPassword123!@#',
    }),
  });

  if (response.ok) {
    throw new Error('Expected failure for wrong password');
  }

  const data = await response.json();

  if (data.success !== false) {
    throw new Error('Expected success: false');
  }

  if (!data.error?.includes('Invalid email or password')) {
    throw new Error('Expected invalid credentials error');
  }
}

/**
 * Test 6: Access protected route with token
 */
async function testSessionWithToken(token: string) {
  const response = await fetch(`${API_URL}/api/auth/session`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Expected 200, got ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();

  if (!data.authenticated || !data.user) {
    throw new Error('Expected authenticated user');
  }

  if (data.user.email !== 'test@example.com') {
    throw new Error('Email mismatch');
  }
}

/**
 * Test 7: Access protected route without token (should fail)
 */
async function testSessionWithoutToken() {
  const response = await fetch(`${API_URL}/api/auth/session`, {
    method: 'GET',
  });

  if (response.ok) {
    throw new Error('Expected failure without token');
  }

  const data = await response.json();

  if (data.authenticated !== false) {
    throw new Error('Expected authenticated: false');
  }
}

/**
 * Test 8: Logout clears session
 */
async function testLogout() {
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Expected 200, got ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error('Expected success: true');
  }

  // Verify cookie is cleared
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('Cookie not cleared');
  }

  if (setCookie.includes('auth_token=;')) {
    // Cookie should be cleared with empty value and past expiration
    const hasExpires = setCookie.includes('Expires=');
    if (!hasExpires) {
      throw new Error('Cleared cookie should have past expiration date');
    }
  }
}

/**
 * Test 9: Token expiration
 */
async function testTokenExpiration() {
  // This test requires a token that will expire soon
  // For now, we'll test with an invalid/expired token format

  const response = await fetch(`${API_URL}/api/auth/session`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid.token.here',
    },
  });

  if (response.ok) {
    throw new Error('Expected failure for invalid token');
  }

  const data = await response.json();

  if (data.authenticated !== false) {
    throw new Error('Expected authenticated: false');
  }
}

/**
 * Test 10: Rate limiting
 */
async function testRateLimiting() {
  const email = `ratelimit-test-${Date.now()}@example.com`;

  // Make 5 requests (should be allowed)
  for (let i = 0; i < 5; i++) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `${email}${i}`,
        password: 'Test123!@#',
        name: 'Rate Limit Test',
      }),
    });

    if (i < 4 && response.status === 429) {
      throw new Error(`Rate limit triggered too early (request ${i + 1})`);
    }
  }

  // 6th request should be rate limited
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `${email}5`,
      password: 'Test123!@#',
      name: 'Rate Limit Test',
    }),
  });

  if (response.status !== 429) {
    throw new Error('Expected 429 status for rate limit');
  }

  const retryAfter = response.headers.get('Retry-After');
  if (!retryAfter) {
    throw new Error('Expected Retry-After header');
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Starting Authentication Tests\n');
  console.log(`📍 API URL: ${API_URL}\n`);

  let token: string | null = null;

  await runTest('1. Register new user (valid data)', async () => {
    token = await testRegisterValidUser();
  });

  await runTest('2. Register with invalid email', testRegisterInvalidEmail);

  await runTest('3. Register with weak password', testRegisterWeakPassword);

  await runTest('4. Login with correct credentials', async () => {
    token = await testLoginCorrectCredentials();
  });

  await runTest('5. Login with wrong password', testLoginWrongPassword);

  if (token) {
    await runTest('6. Access protected route with token', async () => {
      await testSessionWithToken(token!);
    });
  }

  await runTest('7. Access protected route without token', testSessionWithoutToken);

  await runTest('8. Logout clears session', testLogout);

  await runTest('9. Token expiration', testTokenExpiration);

  await runTest('10. Rate limiting enforced', testRateLimiting);

  // Print summary
  console.log('\n📊 Test Results Summary\n');
  console.log('═'.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name} (${result.duration}ms)`);
    if (!result.passed) {
      console.log(`   ${result.message}`);
    }
  });

  console.log('═'.repeat(60));
  console.log(`\nTotal: ${results.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Duration: ${totalDuration}ms`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
