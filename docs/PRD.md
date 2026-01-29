# Product Requirements Document (PRD)
## TradingWeb - Stock Trading Recommendation System

**Version**: 1.0
**Date**: 2025-01-25
**Status**: Draft
**Product Manager**: [To be defined]
**Engineering Lead**: [To be defined]

---

## 1. PRODUCT OVERVIEW

### 1.1 Product Vision
TradingWeb is an intelligent stock trading assistant that automates technical analysis and provides data-driven trading recommendations for retail investors, focusing initially on the SP500 with expansion plans to Asian markets.

### 1.2 Product Goals
1. **Short-term (3 months)**: Launch MVP with 100 active users
2. **Mid-term (6 months)**: Achieve 60% signal accuracy, 500 users
3. **Long-term (12 months)**: 2000 users, expand to Thai SET market

### 1.3 Product Positioning
- **For**: Individual retail investors in Thailand
- **Who want**: Professional-grade stock analysis without high costs
- **TradingWeb is**: An automated stock screening and signal generation platform
- **Unlike**: Expensive tools like TradingView or basic broker tools
- **Our solution**: Combines proven Minervini strategy with ML, optimized for Thai timezone

---

## 2. USER PERSONAS

### 2.1 Primary Persona: "Somchai the Part-Time Trader"
**Demographics**:
- Age: 35-50
- Location: Bangkok, Thailand
- Occupation: Software engineer, business owner
- Income: ฿50,000-100,000/month

**Goals**:
- Grow wealth through stock trading
- Minimize time spent on analysis
- Make data-driven decisions (not emotional)

**Pain Points**:
- Too many stocks to analyze
- Lacks technical analysis expertise
- Can't monitor market during work hours
- Expensive tools ($100+/month)

**Behaviors**:
- Trades 1-2 times per month
- Holds positions for weeks/months
- Uses mobile for quick checks
- Values simplicity and clarity

**How TradingWeb Helps**:
- Daily screening reduces search to 5-10 quality stocks
- Clear signals (buy/hold/sell) remove ambiguity
- Mobile-friendly dashboard for on-the-go access
- Affordable or free pricing

---

### 2.2 Secondary Persona: "Nida the New Investor"
**Demographics**:
- Age: 25-35
- Location: Bangkok, Thailand
- Occupation: Marketing professional
- Investing Experience: 6 months

**Goals**:
- Learn stock investing
- Build long-term portfolio
- Avoid costly mistakes

**Pain Points**:
- Overwhelmed by information
- Doesn't understand technical indicators
- Afraid of losing money
- No guidance on when to buy/sell

**How TradingWeb Helps**:
- Educational: Shows which criteria passed/failed
- Conservative: Only suggests high-quality setups
- Signals: Clear guidance on entry/exit points

---

## 3. USER STORIES

### 3.1 Epic: Data Management
#### US-001: Automated Data Feed
**As a** system admin
**I want** market data to be fetched automatically every day
**So that** I don't have to manually update stock prices

**Acceptance Criteria**:
- [ ] System fetches SP500 data at 6:00 AM Bangkok time
- [ ] Initial load gets 3 years of historical data
- [ ] Subsequent loads get incremental data only
- [ ] Failed fetches retry up to 3 times
- [ ] Rate limiting prevents API blocking
- [ ] Admin receives alert on persistent failures

**Priority**: P0 (Must have)
**Estimate**: 5 story points
**Sprint**: 1

---

#### US-002: Data Quality Validation
**As a** system admin
**I want** to ensure fetched data is accurate
**So that** users can trust the signals

**Acceptance Criteria**:
- [ ] Price anomalies detected (>20% daily change)
- [ ] Missing data gaps identified
- [ ] Data freshness dashboard shows last update time
- [ ] Admin can manually trigger data refresh
- [ ] Data validation runs after each fetch

**Priority**: P0 (Must have)
**Estimate**: 3 story points
**Sprint**: 1

---

### 3.2 Epic: Stock Screening
#### US-003: Minervini Trend Template Screening
**As a** trader
**I want** to see which stocks pass the Minervini criteria
**So that** I can focus on high-quality setups

**Acceptance Criteria**:
- [ ] All SP500 stocks screened daily at 6:30 AM
- [ ] Results displayed on dashboard
- [ ] Each stock shows:
  - Symbol, name, current price
  - Which of 8 criteria passed/failed
  - MA50, MA150, MA200 values
  - Relative strength score
- [ ] Filter by minimum criteria passed
- [ ] Sort by criteria passed or symbol

**Priority**: P0 (Must have)
**Estimate**: 8 story points
**Sprint**: 1

---

#### US-004: Screening Detail View
**As a** trader
**I want** to see detailed analysis for a specific stock
**So that** I can understand why it passed/failed

**Acceptance Criteria**:
- [ ] Clicking stock card shows detail page
- [ ] Detail page displays:
  - All 8 Minervini criteria with status (pass/fail)
  - 52-week high/low with current price position
  - Price vs MA chart
  - Recent price history
  - Related signals
- [ ] Link to add to watchlist
- [ ] Link to external chart (TradingView)

**Priority**: P0 (Must have)
**Estimate**: 5 story points
**Sprint**: 1

---

### 3.3 Epic: Signal Generation
#### US-005: ML-Based Signals
**As a** trader
**I want** to receive buy/hold/sell signals
**So that** I know when to enter or exit positions

**Acceptance Criteria**:
- [ ] Signals generated daily for screened stocks
- [ ] Signal types: Buy (1), Hold (0), Sell (-1)
- [ ] Each signal includes:
  - Confidence score (0-100%)
  - Feature values that influenced decision
  - Timestamp
- [ ] Only signals with >50% confidence displayed
- [ ] Historical signals persist in database

**Priority**: P0 (Must have)
**Estimate**: 8 story points
**Sprint**: 2

---

#### US-006: Signal History
**As a** trader
**I want** to see past signals for a stock
**So that** I can evaluate signal quality

**Acceptance Criteria**:
- [ ] Stock detail page shows signal history
- [ ] History includes past 30 signals
- [ ] Each signal shows:
  - Date, signal type, confidence
  - Price at signal time
  - Current price (for performance check)
- [ ] Export to CSV

**Priority**: P1 (Should have)
**Estimate**: 3 story points
**Sprint**: 2

---

### 3.4 Epic: User Dashboard
#### US-007: Dashboard Overview
**As a** trader
**I want** a clear overview of market opportunities
**So that** I can quickly assess trading options

**Acceptance Criteria**:
- [ ] Homepage shows:
  - Count of stocks that passed screening
  - List of new buy signals
  - Market status (open/closed)
  - Last data update time
- [ ] Responsive design (desktop, tablet)
- [ ] Auto-refresh every 5 minutes (when market open)
- [ ] Quick filters: "Today's New Signals", "All Screened"

**Priority**: P0 (Must have)
**Estimate**: 5 story points
**Sprint**: 1

---

#### US-008: Price Charts
**As a** trader
**I want** to see price charts with technical indicators
**So that** I can visualize stock performance

**Acceptance Criteria**:
- [ ] Chart shows 1-year price history
- [ ] Overlays: MA50, MA150, MA200
- [ ] Volume bars below price
- [ ] Interactive: zoom, pan
- [ ] Signals marked on chart (buy/sell arrows)
- [ ] Export chart as image

**Priority**: P1 (Should have)
**Estimate**: 8 story points
**Sprint**: 2

---

### 3.5 Epic: Admin Panel
#### US-009: Job Management
**As an** admin
**I want** to control background jobs
**So that** I can manage system operations

**Acceptance Criteria**:
- [ ] List all jobs: Data Feed, Screening, ML Signals
- [ ] Each job shows:
  - Status (idle, running, stopped, error)
  - Last run time
  - Next run time (if scheduled)
  - Schedule (cron expression)
- [ ] Start/Stop buttons for each job
- [ ] Configure schedule for each job
- [ ] View recent job logs

**Priority**: P0 (Must have)
**Estimate**: 5 story points
**Sprint**: 1

---

#### US-010: System Monitoring
**As an** admin
**I want** to monitor system health
**So that** I can proactively address issues

**Acceptance Criteria**:
- [ ] Dashboard shows:
  - Database connection status
  - Last successful data fetch
  - Job success rate (last 7 days)
  - Error rate (last 24 hours)
  - Active user count
- [ ] Alerts configured for:
  - Job failures
  - Data quality issues
  - High error rates

**Priority**: P1 (Should have)
**Estimate**: 5 story points
**Sprint**: 3

---

### 3.6 Epic: User Management
#### US-011: User Authentication
**As a** user
**I want** to securely log in
**So that** my data is private

**Acceptance Criteria**:
- [ ] User registration: email, password, name
- [ ] Email verification required
- [ ] Password reset via email
- [ ] Session management (remember me)
- [ ] JWT token-based API auth
- [ ] Role-based access: user, admin

**Priority**: P0 (Must have)
**Estimate**: 8 story points
**Sprint**: 2

---

#### US-012: Watchlist
**As a** trader
**I want** to save stocks to my watchlist
**So that** I can track them over time

**Acceptance Criteria**:
- [ ] Add stock to watchlist from detail page
- [ ] Watchlist accessible from main menu
- [ ] Watchlist shows:
  - Stock symbol, name, price
  - Current signal (if any)
  - Price change %
  - Remove from watchlist button
- [ ] Maximum 50 stocks per watchlist

**Priority**: P1 (Should have)
**Estimate**: 5 story points
**Sprint**: 3

---

### 3.7 Epic: Notifications
#### US-013: Email Alerts
**As a** trader
**I want** to receive email alerts for new signals
**So that** I don't miss opportunities

**Acceptance Criteria**:
- [ ] User can enable email alerts in settings
- [ ] Email sent when:
  - New buy signal for watchlist stock
  - High-confidence signal (>75%)
  - Signal changes from buy to sell
- [ ] Email includes:
  - Stock symbol, name
  - Signal type, confidence
  - Link to detail page
- [ ] Unsubscribe link in email
- [ ] Daily digest option (all signals in one email)

**Priority**: P2 (Could have)
**Estimate**: 5 story points
**Sprint**: 4

---

### 3.8 Epic: Portfolio Tracking
#### US-014: Portfolio Management
**As a** trader
**I want** to track my holdings
**So that** I can monitor my performance

**Acceptance Criteria**:
- [ ] Add position: symbol, shares, buy price, buy date
- [ ] Portfolio shows:
  - Each position: symbol, shares, avg cost, current value, P&L
  - Total portfolio value
  - Total P&L (amount and %)
- [ ] Edit/close positions
- [ ] Performance chart (portfolio value over time)

**Priority**: P1 (Should have)
**Estimate**: 8 story points
**Sprint**: 4

---

### 3.9 Epic: Analytics
#### US-015: Backtesting Report
**As a** trader
**I want** to see historical signal performance
**So that** I can evaluate signal quality

**Acceptance Criteria**:
- [ ] Report shows:
  - Signal accuracy (% correct)
  - If followed all buy signals, what would be ROI
  - Win/loss ratio
  - Average hold duration
  - Best and worst performing signals
- [ ] Filterable by:
  - Time period (last month, 3 months, year, all)
  - Stock symbol
  - Signal type (buy/sell)
- [ ] Export to PDF

**Priority**: P1 (Should have)
**Estimate**: 8 story points
**Sprint**: 3

---

## 4. FUNCTIONAL SPECIFICATIONS

### 4.1 Data Model

#### Stocks Table
```prisma
Stock {
  symbol: String (PK)
  name: String
  exchange: String
  sector: String?
  industry: String?
  marketCap: BigInt?
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Stock Prices Table
```prisma
StockPrice {
  id: String (PK)
  symbol: String (FK)
  date: DateTime
  open: Decimal
  high: Decimal
  low: Decimal
  close: Decimal
  volume: BigInt
  adjClose: Decimal
  createdAt: DateTime

  Unique: (symbol, date)
}
```

#### Screened Stocks Table
```prisma
ScreenedStock {
  id: String (PK)
  symbol: String (FK)
  date: DateTime
  price: Decimal
  ma50: Decimal
  ma150: Decimal
  ma200: Decimal
  priceAboveMa150: Boolean
  ma150AboveMa200: Boolean
  ma200TrendingUp: Boolean
  ma50AboveMa150: Boolean
  priceAboveMa50: Boolean
  priceAbove52WeekLow: Boolean
  priceNear52WeekHigh: Boolean
  relativeStrengthPositive: Boolean
  week52Low: Decimal?
  week52High: Decimal?
  relativeStrength: Decimal?
  passedCriteria: Int (0-8)

  Unique: (symbol, date)
}
```

#### Signals Table
```prisma
Signal {
  id: String (PK)
  symbol: String (FK)
  date: DateTime
  signal: Int (-1, 0, 1)
  confidence: Decimal (0-1)
  ma20Ma50: Decimal
  rsi: Decimal
  macd: Decimal
  macdSignal: Decimal
  macdHistogram: Decimal
  bollingerUpper: Decimal?
  bollingerMiddle: Decimal?
  bollingerLower: Decimal?
  obv: BigInt
  ichimokuTenkan: Decimal?
  ichimokuKijun: Decimal?
  ichimokuSenkouA: Decimal?
  ichimokuSenkouB: Decimal?

  Unique: (symbol, date)
}
```

### 4.2 API Endpoints

#### Stocks
```
GET /api/stocks
  - Query params: ?screened=true
  - Returns: Array of stocks

GET /api/stocks/:symbol
  - Returns: Stock detail with prices and signals
```

#### Signals
```
GET /api/signals
  - Query params: ?symbol=AAPL&type=buy
  - Returns: Array of signals
```

#### Jobs
```
GET /api/jobs
  - Returns: Array of jobs

POST /api/jobs
  - Body: { action: "start"|"stop"|"update-schedule", jobId, schedule }
  - Returns: Success message

GET /api/jobs/logs
  - Query params: ?jobId=xxx&limit=50
  - Returns: Array of job logs
```

### 4.3 Screen Flows

#### Main User Flow: Find Trading Opportunity
```
1. User visits dashboard
2. Views screened stocks list
3. Filters by "passed 6+ criteria"
4. Clicks stock with "buy" signal
5. Reviews detail page:
   - Charts
   - Criteria breakdown
   - Signal history
6. Adds to watchlist
7. Makes trading decision
```

#### Admin Flow: Check System Health
```
1. Admin visits /admin
2. Reviews job statuses
3. Checks recent logs for errors
4. Views system metrics
5. If issue found: stops job, investigates, restarts
```

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Page Load | <3s (p95) | Google Analytics |
| API Latency | <200ms (p95) | APM tool |
| Time to Interactive | <5s | Lighthouse |
| Database Query | <100ms (p95) | Slow query log |

### 5.2 Security
- All passwords hashed (bcrypt)
- JWT tokens expire after 7 days
- HTTPS only in production
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- CSRF tokens for forms
- Rate limiting: 100 req/min per user

### 5.3 Accessibility
- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader compatible
- Color contrast ratio 4.5:1
- Alt text for images

### 5.4 Browser Support
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

---

## 6. UI/UX SPECIFICATIONS

### 6.1 Design System
- **Font**: Inter or system-ui
- **Colors**:
  - Primary: Blue (#3b82f6)
  - Success: Green (#10b981)
  - Warning: Yellow (#f59e0b)
  - Error: Red (#ef4444)
  - Neutral: Gray scale
- **Spacing**: 4px base unit (multiples: 8, 12, 16, 24, 32)
- **Border Radius**: 4px (buttons), 8px (cards)
- **Shadows**: Subtle (0-1px 3px rgba(0,0,0,0.1))

### 6.2 Key Screens

#### Dashboard
```
┌─────────────────────────────────────────────┐
│ TradingWeb          [Dashboard] [Admin]     │
├─────────────────────────────────────────────┤
│                                             │
│ 📊 Market Overview                          │
│ ├ 12 stocks passed screening today          │
│ ├ 5 new buy signals                         │
│ └ Market: CLOSED                            │
│                                             │
│ 🔍 Screened Stocks                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ AAPL     │ │ MSFT     │ │ GOOGL    │     │
│ │ $182.50  │ │ $378.90  │ │ $141.20  │     │
│ │ BUY 75%  │ │ BUY 68%  │ │ HOLD 50% │     │
│ │ 8/8 ✓    │ │ 7/8 ✓    │ │ 6/8 ✓    │     │
│ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────┘
```

#### Stock Detail
```
┌─────────────────────────────────────────────┐
│ ← Back to Dashboard                         │
├─────────────────────────────────────────────┤
│ Apple Inc. (AAPL)                           │
│ NASDAQ                                      │
│                                             │
│ [Price Chart - 1 Year]                      │
│                                             │
│ Minervini Criteria                          │
│ ✓ Price > MA150          $182.50 > $175.20  │
│ ✓ MA150 > MA200          $175.20 > $168.50  │
│ ✓ MA200 trending up      ↑                  │
│ ...                                         │
│                                             │
│ Current Signal                              │
│ 🟢 BUY - Confidence: 75%                    │
│                                             │
│ Recent Signals                              │
│ [History Table]                             │
└─────────────────────────────────────────────┘
```

### 6.3 Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 7. TESTING REQUIREMENTS

### 7.1 Unit Tests
- All service functions: 80% coverage
- Utility functions: 100% coverage
- API route handlers: 70% coverage

### 7.2 Integration Tests
- Data pipeline: fetch → screen → signal
- Job scheduling: start → execute → complete
- Database operations: CRUD all tables

### 7.3 End-to-End Tests
- User registration/login
- View dashboard
- Stock detail navigation
- Admin job controls

### 7.4 Performance Tests
- Load test: 100 concurrent users
- API stress test: 1000 req/sec
- Database query performance

### 7.5 Security Tests
- OWASP Top 10 vulnerabilities
- Penetration testing
- Dependency vulnerability scanning

---

## 8. RELEASE PLANNING

### 8.1 MVP Release (Sprint 1-2, Weeks 1-4)
**Scope**:
- Data feed (SP500)
- Minervini screening
- Rule-based signals
- User dashboard
- Admin panel

**Excluded**:
- Authentication
- Watchlist
- Portfolio
- Charts

**Success Criteria**:
- System runs unattended for 1 week
- 10 beta users access dashboard

### 8.2 Version 1.0 (Sprint 3-4, Weeks 5-8)
**Added**:
- Authentication
- Charts
- Watchlist
- Enhanced signals
- Documentation

**Success Criteria**:
- 100 active users
- 99% uptime

### 8.3 Version 1.5 (Sprint 5-6, Weeks 9-12)
**Added**:
- Portfolio tracking
- Notifications
- Backtesting
- Mobile optimization

**Success Criteria**:
- 500 active users
- 60% signal accuracy

### 8.4 Version 2.0 (Sprint 7-8, Weeks 13-16)
**Added**:
- ML model enhancement
- Thai SET market
- Thai language support
- Advanced analytics

**Success Criteria**:
- 2000 active users
- Asian market expansion

---

## 9. SUCCESS METRICS

### 9.1 Product Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Weekly Active Users | 100 (MVP), 2000 (v2.0) | Analytics |
| User Retention (Day 30) | 40% | Analytics |
| Avg Session Duration | 5 min | Analytics |
| Screens Viewed/Session | 5 | Analytics |

### 9.2 Technical Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Uptime | 99% | Uptime robot |
| API Response Time | <200ms p95 | APM |
| Error Rate | <1% | Error tracking |
| Data Accuracy | >99% | Validation |

### 9.3 Business Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Signal Accuracy | >60% | Backtesting |
| User Satisfaction | 4.0/5.0 | Survey |
| Support Tickets | <10/month | Helpdesk |
| Cost Per User | <$5/month | Finance |

---

## 10. COMPETITIVE ANALYSIS

### 10.1 TradingView
**Strengths**: Excellent charts, huge community, many indicators
**Weaknesses**: Expensive, overwhelming for beginners, no screening
**Our Advantage**: Focused screening, simple signals, Thai timezone

### 10.2 StockCharts
**Strengths**: Good scanning tools, affordable
**Weaknesses**: Dated UI, US-focused, no mobile app
**Our Advantage**: Modern UI, mobile-friendly, Asian market focus

### 10.3 Broker Tools (Thanaprapat, KGI)
**Strengths**: Free, integrated with trading
**Weaknesses**: Limited features, poor UX, no recommendations
**Our Advantage**: Better UX, actionable signals, educational

---

## 11. RISKS & MITIGATION

### 11.1 Product Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Low user adoption | High | Free tier, marketing, UX improvements |
| Poor signal accuracy | High | Continuous model improvement, backtesting |
| Yahoo Finance API changes | Medium | Abstraction layer, alternative sources |

### 11.2 Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Database performance | Medium | Indexing, caching, query optimization |
| Scalability issues | Medium | Cloud infrastructure, load balancing |
| Security breach | High | Regular audits, penetration testing |

---

## 12. APPENDICES

### Appendix A: Technical Architecture
```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │ HTTP
┌──────▼──────┐
│ API Routes  │
│  (Next.js)  │
└──────┬──────┘
       │
┌──────▼──────┐
│  Services   │
│             │
│ ┌─────────┐ │
│ │  Jobs   │ │◄──── node-cron
│ └─────────┘ │
└──────┬──────┘
       │
┌──────▼──────┐
│  Database   │
│ (PostgreSQL)│
└─────────────┘
```

### Appendix B: Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 15, Prisma ORM
- **Scheduling**: node-cron
- **Data Source**: yahoo-finance2
- **Charts**: Recharts (planned)
- **Auth**: NextAuth.js (planned)
- **Hosting**: DigitalOcean/AWS

### Appendix C: Open Questions
1. Should we support additional markets beyond SP500? → Decision: Phase 2
2. What pricing model? → Decision: Freemium (future)
3. Mobile app or responsive web? → Decision: Responsive web first
4. Real-time or delayed data? → Decision: Delayed (daily) sufficient
5. Should we provide financial advice disclaimers? → Decision: Yes, required

---

## 13. SIGN-OFF

**Document Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | | | |
| Engineering Lead | | | |
| UI/UX Designer | | | |
| Business Sponsor | | | |

---

**Version History**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-25 | Initial | Initial PRD creation from BRD |

---

**Next Steps**:
1. PRD review with stakeholders
2. Prioritization workshop
3. Sprint planning for MVP
4. Development kickoff
