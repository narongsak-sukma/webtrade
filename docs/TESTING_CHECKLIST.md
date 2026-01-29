# Testing Checklist

Complete testing checklist for TradingWeb application validation.

## Table of Contents
- [Pre-Testing Checklist](#pre-testing-checklist)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [End-to-End Tests](#end-to-end-tests)
- [Performance Tests](#performance-tests)
- [Security Tests](#security-tests)
- [Agent-Specific Validation](#agent-specific-validation)

---

## Pre-Testing Checklist

### Environment Setup
- [ ] Node.js installed (v18+)
- [ ] PostgreSQL database running
- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Test database created and migrations run
- [ ] Testing dependencies installed (vitest, @testing-library/react, etc.)

### Test Configuration
- [ ] `vitest.config.ts` configured
- [ ] Test setup file created (`tests/setup.ts`)
- [ ] Coverage thresholds configured (80% minimum)
- [ ] Test fixtures loaded

---

## Unit Tests

### Services Layer

#### Yahoo Finance Service (`tests/services/yahoo-finance.test.ts`)
- [ ] Test `fetchStockInfo()` - fetches stock metadata
- [ ] Test `fetchHistoricalData()` - retrieves price history
- [ ] Test `savePriceData()` - persists price data
- [ ] Test `getLatestDateInDB()` - gets latest price date
- [ ] Test `fetchAndSaveInitialData()` - initial data fetch
- [ ] Test `fetchAndSaveIncrementalData()` - incremental updates
- [ ] Test `updateStockList()` - batch stock updates
- [ ] Test `fetchDataFeed()` - complete data feed
- [ ] Test rate limiting between requests
- [ ] Test error handling for invalid symbols
- [ ] Test graceful degradation when API unavailable

#### Minervini Screener Service (`tests/services/minervini-screener.test.ts`)
- [ ] Test `calculateSMA()` - Simple Moving Average
- [ ] Test `get52WeekHighLow()` - 52-week high/low
- [ ] Test `isMa200TrendingUp()` - MA200 trend detection
- [ ] Test `calculateRelativeStrength()` - vs SPY
- [ ] Test `screenStock()` - individual stock screening
- [ ] Test `screenAllStocks()` - batch screening
- [ ] Verify all 8 Minervini criteria calculated
- [ ] Verify criteria counted correctly
- [ ] Test screening results saved to database
- [ ] Test handling of insufficient data
- [ ] Test graceful error handling

#### ML Signals Service (`tests/services/ml-signals.test.ts`)
- [ ] Test `calculateRSI()` - Relative Strength Index
- [ ] Test `calculateMACD()` - MACD components
- [ ] Test `calculateBollingerBands()` - Bollinger Bands
- [ ] Test `calculateOBV()` - On-Balance Volume
- [ ] Test `calculateIchimoku()` - Ichimoku Cloud
- [ ] Test `generateSignal()` - ML-based signal
- [ ] Test `generateRuleBasedSignal()` - fallback rules
- [ ] Test `generateSignalsForAll()` - batch generation
- [ ] Test service initialization
- [ ] Test ML model availability check
- [ ] Verify signal values (-1, 0, 1)
- [ ] Verify confidence ranges (0-1)
- [ ] Test all technical indicators included

### API Layer

#### Authentication API (`tests/api/auth.test.ts`)
- [ ] **POST /api/auth/register**
  - [ ] Register with valid data
  - [ ] Reject invalid email format
  - [ ] Reject weak password
  - [ ] Reject duplicate email
  - [ ] Verify password hashed (bcrypt)
  - [ ] Verify JWT token generated
  - [ ] Test rate limiting (5 req/min)
  - [ ] Verify user created in database

- [ ] **POST /api/auth/login**
  - [ ] Login with correct credentials
  - [ ] Reject wrong password
  - [ ] Reject non-existent email
  - [ ] Implement exponential backoff
  - [ ] Clear attempts on success
  - [ ] Test rate limiting
  - [ ] Verify token generation

- [ ] **GET /api/auth/session**
  - [ ] Return session for authenticated user
  - [ ] Return unauthenticated for no token
  - [ ] Reject invalid token

- [ ] **POST /api/auth/logout**
  - [ ] Clear session cookie
  - [ ] Return success response

#### Stocks API (`tests/api/stocks.test.ts`)
- [ ] **GET /api/stocks**
  - [ ] Return all stocks with latest prices
  - [ ] Limit to 100 stocks
  - [ ] Include metadata (name, exchange, sector)

- [ ] **GET /api/stocks?symbol=X**
  - [ ] Return specific stock
  - [ ] Return 404 for non-existent

- [ ] **GET /api/stocks?screened=true**
  - [ ] Return screened stocks
  - [ ] Filter by passed criteria >= 6
  - [ ] Include stock metadata

- [ ] **GET /api/stocks/[symbol]**
  - [ ] Return stock with history
  - [ ] Handle invalid symbols

#### Signals API (`tests/api/signals.test.ts`)
- [ ] **GET /api/signals**
  - [ ] Return all signals
  - [ ] Verify signal structure
  - [ ] Verify value ranges
  - [ ] Filter by symbol

- [ ] Test buy signals (1)
- [ ] Test hold signals (0)
- [ ] Test sell signals (-1)
- [ ] Test confidence levels
- [ ] Handle empty results

#### Jobs API (`tests/api/jobs.test.ts`)
- [ ] **GET /api/jobs**
  - [ ] Return all job executions
  - [ ] Include job status
  - [ ] Include job types

- [ ] **POST /api/jobs**
  - [ ] Trigger job execution
  - [ ] Reject invalid job type
  - [ ] Require authentication

- [ ] **GET /api/jobs/logs**
  - [ ] Return job logs
  - [ ] Filter by job ID
  - [ ] Include log levels
  - [ ] Include timestamps

---

## Integration Tests

### Data Pipeline (`tests/integration/data-pipeline.test.ts`)
- [ ] **Complete Pipeline**
  - [ ] Fetch → Screen → Signal flow
  - [ ] Verify data consistency
  - [ ] Test with real stock symbol
  - [ ] Handle pipeline failures

- [ ] **Batch Processing**
  - [ ] Process multiple stocks
  - [ ] Verify all stages complete
  - [ ] Check for data consistency

- [ ] **Error Recovery**
  - [ ] Recover from screening failure
  - [ ] Continue if one stock fails
  - [ ] Maintain data integrity

- [ ] **Performance**
  - [ ] Complete within time limit (<5s per stock)
  - [ ] Handle concurrent requests

### Authentication Flow (`tests/integration/auth-flow.test.ts`)
- [ ] **Complete Flow**
  - [ ] Register → Login → Session → Logout
  - [ ] Verify each step works
  - [ ] Test session persistence

- [ ] **Failed Attempts**
  - [ ] Handle multiple failed logins
  - [ ] Test exponential backoff
  - [ ] Clear attempts on success

- [ ] **Protected Resources**
  - [ ] Allow access with valid token
  - [ ] Deny without token
  - [ ] Deny with invalid token

- [ ] **Session Management**
  - [ ] Maintain across requests
  - [ ] Clear after logout

- [ ] **Security**
  - [ ] No plaintext passwords
  - [ ] Enforce rate limiting
  - [ ] Prevent SQL injection

---

## End-to-End Tests

### User Workflows
- [ ] **New User Registration**
  - [ ] Navigate to registration page
  - [ ] Fill valid registration form
  - [ ] Submit and verify account created
  - [ ] Auto-login after registration

- [ ] **User Login**
  - [ ] Navigate to login page
  - [ ] Enter credentials
  - [ ] Submit and verify dashboard access
  - [ ] Test remember me functionality

- [ ] **View Dashboard**
  - [ ] Load dashboard
  - [ ] View stock list
  - [ ] View signals
  - [ ] View charts
  - [ ] Test interactivity

- [ ] **Admin Functions**
  - [ ] Trigger data feed job
  - [ ] Trigger screening job
  - [ ] Trigger ML signals job
  - [ ] View job logs
  - [ ] View monitoring dashboard

---

## Performance Tests

### API Response Time
- [ ] All API endpoints respond <200ms
- [ ] Stock data endpoint <100ms
- [ ] Signal generation <500ms
- [ ] Authentication endpoints <150ms

### Database Performance
- [ ] Query latency <50ms
- [ ] No slow queries (>1000ms)
- [ ] Connection pool working
- [ ] Indexes properly configured

### Concurrent Users
- [ ] Handle 100 concurrent users
- [ ] Handle 1000 concurrent requests
- [ ] No race conditions
- [ ] Proper queue management

---

## Security Tests

### Authentication Security
- [ ] Passwords hashed with bcrypt (cost 12+)
- [ ] JWT tokens signed and verified
- [ ] Tokens expire appropriately
- [ ] Secure cookie flags set
- [ ] CSRF protection enabled

### API Security
- [ ] Rate limiting enforced
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CORS properly configured

### Data Security
- [ ] No sensitive data in logs
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] API keys not exposed

---

## Agent-Specific Validation

### Agent 1: Frontend Specialist (Charts)
- [ ] TypeScript compilation (strict mode)
- [ ] Components render without errors
- [ ] Data displays correctly
- [ ] Interactive features work (zoom, pan, hover)
- [ ] Loading states work
- [ ] Error states handled gracefully
- [ ] Mobile responsive
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] No console errors
- [ ] Performance acceptable (60fps)

### Agent 2: Backend Specialist (Auth)
- [ ] Registration works with valid data
- [ ] Registration fails with invalid email
- [ ] Registration fails with weak password
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Protected routes work with token
- [ ] Protected routes fail without token
- [ ] Password hashing secure (bcrypt)
- [ ] JWT tokens work correctly
- [ ] Rate limiting enforced
- [ ] SQL injection prevented

### Agent 3: ML Engineer (Enhanced Model)
- [ ] Model trains successfully
- [ ] Model saves/loads correctly
- [ ] Predictions match interface
- [ ] Model accuracy >60%
- [ ] Features calculated correctly
- [ ] Integration with mlSignals service
- [ ] Backtesting shows improvement
- [ ] Training completes <30 minutes
- [ ] Prediction takes <100ms per stock
- [ ] Model handles edge cases

### Agent 4: DevOps Engineer (Monitoring)
- [ ] Health check endpoint works
- [ ] Metrics collect without errors
- [ ] Dashboard displays correctly
- [ ] Auto-refresh works
- [ ] Graceful degradation
- [ ] No performance impact (<1% overhead)
- [ ] Alerts trigger correctly
- [ ] Logs are structured
- [ ] Monitoring data persists

---

## Coverage Requirements

### Minimum Coverage
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Critical Areas (100% coverage)
- Authentication logic
- Password hashing
- JWT token handling
- Database transactions
- External API calls
- Error handling

---

## Test Execution

### Run All Tests
```bash
./scripts/test-all.sh
```

### Run Specific Test Suites
```bash
# Authentication
./scripts/test-auth.sh

# Data Pipeline
./scripts/test-pipeline.sh

# ML Model
./scripts/test-ml.sh
```

### Run Individual Test Files
```bash
npx vitest run tests/api/auth.test.ts
npx vitest run tests/services/yahoo-finance.test.ts
npx vitest run tests/integration/data-pipeline.test.ts
```

### Watch Mode
```bash
npx vitest watch
```

### Coverage Report
```bash
npx vitest run --coverage
```

---

## Success Criteria

### All Tests Pass
- [ ] 0 failures
- [ ] >90% pass rate
- [ ] No critical bugs

### Coverage Met
- [ ] >80% code coverage
- [ ] 100% coverage for critical paths
- [ ] All uncovered code reviewed

### Performance Validated
- [ ] API response times acceptable
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Concurrent users supported

### Security Validated
- [ ] No vulnerabilities found
- [ ] All security tests pass
- [ ] Code review completed

### Documentation Complete
- [ ] All test cases documented
- [ ] Test results recorded
- [ ] Bugs tracked and fixed

---

## Bug Reporting

See [BUG_REPORTING.md](./BUG_REPORTING.md) for bug reporting process and templates.

---

## Quality Gates

See [QUALITY_GATE.md](./QUALITY_GATE.md) for quality gates and approval process.

---

## Continuous Integration

### Pre-Commit Checks
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Unit tests pass
- [ ] No critical issues

### Pre-Merge Checks
- [ ] All tests pass
- [ ] Coverage thresholds met
- [ ] Code review completed
- [ ] Documentation updated

### Deployment Checks
- [ ] All quality gates passed
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Stakeholder approval obtained

---

## Maintenance

### Regular Updates
- [ ] Update test fixtures monthly
- [ ] Review and update test cases quarterly
- [ ] Update dependencies regularly
- [ ] Refactor tests as needed

### Test Health
- [ ] Remove flaky tests
- [ ] Optimize slow tests
- [ ] Fix broken tests immediately
- [ ] Keep test data fresh

---

## Contact

For questions or issues with testing, contact the QA team or create an issue in the project repository.
