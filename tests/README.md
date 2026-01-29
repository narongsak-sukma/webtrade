# TradingWeb Testing System

Comprehensive testing and quality assurance system for TradingWeb application.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test:all

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Test Structure

```
tests/
├── api/                    # API endpoint tests
│   ├── auth.test.ts       # Authentication endpoints
│   ├── stocks.test.ts     # Stock data endpoints
│   ├── signals.test.ts    # Signal generation endpoints
│   └── jobs.test.ts       # Job management endpoints
├── services/              # Service layer tests
│   ├── yahoo-finance.test.ts      # Yahoo Finance integration
│   ├── minervini-screener.test.ts # Minervini screening
│   └── ml-signals.test.ts         # ML signal generation
├── integration/           # Integration tests
│   ├── data-pipeline.test.ts      # Complete data pipeline
│   └── auth-flow.test.ts          # Authentication workflows
└── fixtures/              # Test data
    ├── test-stocks.json
    ├── test-prices.json
    └── test-signals.json
```

## Test Scripts

### Run All Tests
```bash
npm run test:all
# or
./scripts/test-all.sh
```

### Run Specific Test Suites
```bash
# Authentication tests
npm run test:auth

# Data pipeline tests
npm run test:pipeline

# ML model tests
npm run test:ml
```

### Individual Test Files
```bash
npx vitest run tests/api/auth.test.ts
npx vitest run tests/services/yahoo-finance.test.ts
npx vitest run tests/integration/data-pipeline.test.ts
```

### Coverage Report
```bash
npm run test:coverage
# Report generated in: coverage/index.html
```

## Coverage Targets

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

Current overall coverage: **86%** ✓

## Test Documentation

- [Testing Checklist](../docs/TESTING_CHECKLIST.md) - Complete testing checklist
- [Quality Gate](../docs/QUALITY_GATE.md) - Quality gates and approval process
- [Bug Reporting](../docs/BUG_REPORTING.md) - Bug reporting template and process
- [Validation Report](../docs/TESTING_VALIDATION_REPORT.md) - Complete validation report

## Test Statistics

- **Total Test Suites**: 9
- **Total Test Cases**: 150+
- **Test Code Lines**: 2,450+
- **Documentation Lines**: 2,150+
- **Average Coverage**: 86%

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:run

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Development Workflow

### Writing Tests

1. **Unit Tests**: Test individual functions and components
   ```typescript
   describe('ServiceName', () => {
     it('should do something', () => {
       // Arrange
       const input = { ... };

       // Act
       const result = service.method(input);

       // Assert
       expect(result).toBe(expected);
     });
   });
   ```

2. **Integration Tests**: Test multiple components together
   ```typescript
   describe('Feature Name', () => {
     it('should complete workflow', async () => {
       // Test complete workflow
     });
   });
   ```

### Test Naming

- Use clear, descriptive test names
- Follow `should ...` pattern
- Include what is being tested
- Include expected outcome

Example:
```typescript
it('should return 401 for invalid credentials', () => {
  // Test implementation
});
```

## Best Practices

### DO's
- ✓ Write tests before fixing bugs (TDD)
- ✓ Keep tests simple and focused
- ✓ Use descriptive test names
- ✓ Test edge cases
- ✓ Mock external dependencies
- ✓ Clean up test data
- ✓ Use test fixtures for common data

### DON'Ts
- ✗ Don't test implementation details
- ✗ Don't write flaky tests
- ✗ Don't duplicate test logic
- ✗ Don't ignore test failures
- ✗ Don't commit untested code
- ✗ Don't skip tests without reason

## Troubleshooting

### Tests Failing?

1. Check test output for specific error
2. Verify database is running
3. Check environment variables
4. Clear test database: `npm run db:reset`
5. Re-run tests: `npm run test:run`

### Coverage Low?

1. Run coverage report: `npm run test:coverage`
2. Open `coverage/index.html`
3. Identify uncovered lines
4. Add tests for uncovered code
5. Re-run coverage report

### Database Issues?

```bash
# Reset test database
npm run db:reset

# Regenerate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

## Performance Benchmarks

- **Unit Tests**: <5 minutes
- **Integration Tests**: <10 minutes
- **Full Suite**: <15 minutes
- **API Response Time**: <200ms
- **Signal Generation**: <500ms

## Support

For questions or issues:
- **Documentation**: Check `/docs` folder
- **Issues**: Create GitHub issue
- **Questions**: Contact QA team

## License

Part of TradingWeb project. See main LICENSE file.

---

**Last Updated**: 2025-01-25
**Version**: 1.0.0
