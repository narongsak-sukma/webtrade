# Business Requirements Document (BRD)
## TradingWeb - Stock Trading Recommendation System

**Version**: 1.0
**Date**: 2025-01-25
**Status**: Draft
**Project Sponsor**: [To be defined]
**Document Owner**: [To be defined]

---

## 1. EXECUTIVE SUMMARY

### 1.1 Purpose
TradingWeb is an automated stock trading recommendation system designed to help investors make informed decisions by combining proven technical analysis strategies (Minervini Trend Template) with machine learning-based signal generation.

### 1.2 Business Objectives
- **Primary Objective**: Provide retail investors with professional-grade stock screening and trading signals
- **Secondary Objectives**:
  - Automate tedious stock analysis tasks
  - Reduce emotional trading decisions through data-driven signals
  - Educate users on technical analysis principles
  - Build a platform for strategy backtesting and validation

### 1.3 Target Audience
- **Primary**: Individual retail investors (Thailand market focus)
- **Secondary**: Part-time traders, investment clubs
- **Tertiary**: Financial advisors (future)

### 1.4 Success Metrics
| Metric | Target | Timeline |
|--------|--------|----------|
| Active Users | 100 | Month 3 |
| Data Accuracy | >99% | Ongoing |
| Signal Accuracy | >60% | Month 6 |
| System Uptime | 99% | Ongoing |
| User Retention | 40% | Month 6 |

---

## 2. BUSINESS CONTEXT

### 2.1 Problem Statement
Retail investors face several challenges:
1. **Information Overload**: Too many stocks to analyze manually
2. **Lack of Tools**: Professional tools are expensive
3. **Emotional Decisions**: Trading based on fear/greed rather than data
4. **Time Constraints**: Cannot monitor markets continuously
5. **Limited Knowledge**: Lack expertise in technical analysis

### 2.2 Proposed Solution
TradingWeb addresses these challenges by:
1. **Automated Screening**: Daily analysis of SP500 stocks
2. **Proven Strategy**: Minervini Trend Template (used by market wizard Mark Minervini)
3. **ML Signals**: Data-driven buy/hold/sell recommendations
4. **Convenient Access**: Web-based dashboard accessible 24/7
5. **Educational**: Transparent methodology and criteria display

### 2.3 Market Analysis
- **Market Size**: Thai retail investing market growing 20% YoY
- **Competition**:
  - Local: Broker-provided tools (limited features)
  - International: TradingView, StockCharts (expensive, complex)
- **Differentiation**:
  - Focus on Thai timezone (6 AM data updates)
  - Combination of fundamental + technical analysis
  - Local language support (future)
  - Affordable pricing (freemium model)

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 Core Features

#### 3.1.1 Data Feed (MUST HAVE)
**Business Requirement**: Automated daily market data collection

- **BR-001**: System must fetch SP500 stock data daily at 6:00 AM Bangkok time
- **BR-002**: Initial load must include 3 years of historical data
- **BR-003**: Subsequent updates must be incremental (last date to present)
- **BR-004**: Data must include OHLCV (Open, High, Low, Close, Volume)
- **BR-005**: System must handle missing data and market holidays
- **BR-006**: Data source: Yahoo Finance (free, reliable)

**Business Value**: Ensures users always have up-to-date data for analysis

---

#### 3.1.2 Stock Screening (MUST HAVE)
**Business Requirement**: Identify stocks meeting Minervini Trend Template criteria

- **BR-007**: System must screen all SP500 stocks daily
- **BR-008**: Screening must evaluate 8 Minervini criteria:
  1. Price > 150-day MA
  2. 150-day MA > 200-day MA
  3. 200-day MA trending up (1 month)
  4. 50-day MA > 150-day MA > 200-day MA
  5. Price > 50-day MA
  6. Price ≥ 30% above 52-week low
  7. Price within 25% of 52-week high
  8. Relative strength vs SPY positive
- **BR-009**: Results must show which criteria passed/failed
- **BR-010**: Minimum 6/8 criteria required to pass screening

**Business Value**: Focuses user attention on highest-quality setups

---

#### 3.1.3 Signal Generation (MUST HAVE)
**Business Requirement**: Generate actionable trading signals using ML

- **BR-011**: System must generate buy/hold/sell signals for screened stocks
- **BR-012**: Signals based on 6 technical indicators:
  - MA20/MA50 crossover
  - RSI (14)
  - MACD (12, 26, 9)
  - Bollinger Bands (20, 2)
  - OBV (On-Balance Volume)
  - Ichimoku Cloud
- **BR-013**: Each signal must include confidence score (0-100%)
- **BR-014**: Signal history must be tracked for backtesting

**Business Value**: Provides clear entry/exit guidance

---

#### 3.1.4 User Dashboard (MUST HAVE)
**Business Requirement**: User-friendly interface for viewing results

- **BR-015**: Dashboard must display screened stocks
- **BR-016**: Each stock card shows: symbol, name, price, MAs, signal
- **BR-017**: Clicking stock shows detailed view with charts
- **BR-018**: Signal history visible on detail page
- **BR-019**: Responsive design for desktop/tablet

**Business Value**: Intuitive user experience, quick decision-making

---

#### 3.1.5 Admin Panel (MUST HAVE)
**Business Requirement**: Administrative control of system operations

- **BR-020**: Admin can start/stop all background jobs
- **BR-021**: Admin can configure job schedules
- **BR-022**: Admin can view job execution logs
- **BR-023**: Admin can trigger manual data refresh
- **BR-024**: Dashboard shows system health metrics

**Business Value**: Operational control, troubleshooting capability

---

### 3.2 Nice-to-Have Features

#### 3.2.1 Watchlist (SHOULD HAVE)
- **BR-025**: Users can add stocks to personal watchlist
- **BR-026**: Watchlist persists across sessions
- **BR-027**: Alerts when watchlist stock passes screening

#### 3.2.2 Portfolio Tracking (SHOULD HAVE)
- **BR-028**: Users can track their holdings
- **BR-029**: System calculates portfolio performance
- **BR-030**: P&L tracking per position

#### 3.2.3 Notifications (COULD HAVE)
- **BR-031**: Email alerts for new signals
- **BR-032**: SMS alerts for high-confidence signals
- **BR-033**: Custom alert rules

#### 3.2.4 Backtesting (SHOULD HAVE)
- **BR-034**: Historical signal accuracy report
- **BR-035**: ROI calculation if followed all signals
- **BR-036**: Compare different time periods

---

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1 Performance
| Requirement | Metric | Priority |
|-------------|--------|----------|
| Page Load Time | <3 seconds | P0 |
| API Response | <200ms (p95) | P0 |
| Data Fetch | All SP500 in <1 hour | P0 |
| Concurrent Users | Support 100 | P0 |

### 4.2 Reliability
| Requirement | Metric | Priority |
|-------------|--------|----------|
| System Uptime | 99% (3.65 days downtime/year) | P0 |
| Data Accuracy | >99% correct | P0 |
| Job Success Rate | >95% | P1 |
| Backup Recovery | <4 hours RTO | P1 |

### 4.3 Scalability
| Requirement | Metric | Priority |
|-------------|--------|----------|
| Database Growth | Handle 3 years × 500 stocks | P0 |
| User Growth | Support 1000 users | P1 |
| Market Expansion | Add other markets | P2 |

### 4.4 Security
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Authentication | Secure login, JWT tokens | P0 |
| Authorization | Role-based access (user/admin) | P0 |
| Data Encryption | HTTPS, encrypted passwords | P0 |
| Input Validation | Prevent SQL injection, XSS | P0 |
| Rate Limiting | Prevent API abuse | P1 |

### 4.5 Usability
| Requirement | Description | Priority |
|-------------|-------------|----------|
| UI Language | English (future: Thai) | P0 |
| Timezone | Bangkok (UTC+7) default | P0 |
| Learning Curve | <30 minutes to basic use | P1 |
| Help Documentation | User guide, tooltips | P1 |

---

## 5. DATA REQUIREMENTS

### 5.1 Data Sources
| Data | Source | Update Frequency | Retention |
|------|--------|-----------------|-----------|
| Stock Prices | Yahoo Finance | Daily | 3+ years |
| Stock Metadata | Yahoo Finance | Daily | Indefinite |
| Screen Results | Internal Calculation | Daily | 1 year |
| Signals | Internal ML Model | Daily | 3 years |
| User Data | Internal | Real-time | Indefinite |

### 5.2 Data Quality
- **Accuracy**: Market data must match source 99.9%
- **Completeness**: No missing trading days
- **Timeliness**: Data available by 6:30 AM Bangkok time
- **Consistency**: No duplicate or contradictory records

---

## 6. INTEGRATION REQUIREMENTS

### 6.1 External Systems
| System | Purpose | Protocol |
|--------|---------|----------|
| Yahoo Finance API | Market data | REST |
| PostgreSQL | Data storage | JDBC/ORM |
| Email Service | Notifications | SMTP (future) |

### 6.2 Internal Systems
| Component | Integration Method |
|-----------|-------------------|
| Data Feed → Screening | Database |
| Screening → ML | Database |
| ML → Dashboard | API |
| Admin → Jobs | API |

---

## 7. BUSINESS RULES

### 7.1 Screening Rules
1. Stock must pass minimum 6/8 Minervini criteria
2. Screening runs at 6:30 AM Bangkok time (after data feed)
3. Only SP500 stocks screened (expandable)
4. Results replace previous day's results

### 7.2 Signal Rules
1. Signals generated only for stocks that pass screening
2. Signals: 1 (buy), 0 (hold), -1 (sell)
3. Confidence threshold: minimum 50% to display
4. Historical signals never modified

### 7.3 Access Control
1. Admin users can:
   - Start/stop jobs
   - View logs
   - Modify schedules
   - Access all user data
2. Regular users can:
   - View dashboard
   - See signals
   - Manage watchlist
   - Cannot modify system settings

---

## 8. REPORTING REQUIREMENTS

### 8.1 User Reports
- Daily screened stocks
- Signal history
- Portfolio performance (future)
- Watchlist alerts (future)

### 8.2 Admin Reports
- Job execution logs
- System health metrics
- Data quality reports
- User activity (future)

### 8.3 Business Reports
- Daily active users
- Signal accuracy
- System performance
- Error rates

---

## 9. CONSTRAINTS

### 9.1 Technical Constraints
- Must use free data sources initially
- Must run on standard cloud hosting (AWS/GCP/DigitalOcean)
- Must support browser-based access (no desktop app)
- Database must be PostgreSQL

### 9.2 Budget Constraints
- Initial development: Low cost (opensource tools)
- Monthly hosting: <$50 (MVP)
- Data feeds: Free (Yahoo Finance)

### 9.3 Time Constraints
- MVP: 8 weeks
- Production launch: 12 weeks
- First 100 users: 16 weeks

### 9.4 Regulatory Constraints
- Not providing financial advice (disclaimer required)
- Data usage compliance with Yahoo Finance ToS
- User data privacy (GDPR-like if serving EU users)

---

## 10. RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Yahoo Finance API changes | High | Medium | Alternative data sources, abstraction layer |
| Low ML accuracy | High | Medium | Continuous retraining, feature engineering |
| High hosting costs | Medium | Low | Optimization, caching, consider cheaper providers |
| Security breach | High | Low | Regular audits, penetration testing |
| User adoption low | High | Medium | Marketing, UX improvements, free tier |

---

## 11. FINANCIAL ANALYSIS

### 11.1 Development Costs (One-time)
| Item | Cost (USD) |
|------|------------|
| Development (8 weeks × 1 dev) | $8,000 |
| Testing & QA | $1,000 |
| Documentation | $500 |
| **Total** | **$9,500** |

### 11.2 Operating Costs (Monthly)
| Item | Cost (USD) |
|------|------------|
| Cloud Hosting (DigitalOcean) | $40 |
| Domain Name | $10 |
| Email Service (future) | $20 |
| Monitoring (future) | $10 |
| **Total** | **$80** |

### 11.3 Revenue Model (Future)
| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 20 stocks, delayed signals |
| Basic | $10/month | 100 stocks, real-time signals |
| Pro | $30/month | All stocks, backtesting, alerts |

**Break-even**: ~30 Basic plan subscribers (after covering development costs)

---

## 12. GOVERNANCE

### 12.1 Approval Workflow
1. Business Sponsor approves BRD
2. Product Manager creates PRD from BRD
3. Development Team estimates effort
4. Steering Committee approves budget
5. Sprint planning begins

### 12.2 Change Management
- Minor changes: Product Manager approval
- Major changes: Business Sponsor + Steering Committee
- Scope changes: Impact analysis, budget re-approval

### 12.3 Success Review
- Monthly: Metrics dashboard review
- Quarterly: Business value assessment
- Annually: Strategic planning

---

## 13. APPENDICES

### Appendix A: Glossary
- **MA**: Moving Average
- **RSI**: Relative Strength Index
- **MACD**: Moving Average Convergence Divergence
- **OBV**: On-Balance Volume
- **OHLCV**: Open, High, Low, Close, Volume
- **SP500**: Standard & Poor's 500 Index
- **ROI**: Return on Investment

### Appendix C: References
- Mark Minervini's "Trade Like a Stock Market Wizard"
- Yahoo Finance API Documentation
- Next.js Documentation
- Prisma ORM Documentation

---

**Document Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Business Sponsor | | | |
| Product Manager | | | |
| Tech Lead | | | |
| Project Manager | | | |

---

**Version History**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-25 | Initial | Initial BRD creation |
