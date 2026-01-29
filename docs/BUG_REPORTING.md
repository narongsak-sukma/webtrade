# Bug Reporting

Bug reporting template and process for TradingWeb application.

## Table of Contents
- [Bug Reporting Process](#bug-reporting-process)
- [Bug Severity Levels](#bug-severity-levels)
- [Bug Report Template](#bug-report-template)
- [Bug Lifecycle](#bug-lifecycle)
- [Bug Triage](#bug-triage)
- [Escalation Path](#escalation-path)

---

## Bug Reporting Process

### 1. Identify Bug
- Reproduce the issue consistently
- Document the expected behavior
- Document the actual behavior
- Gather relevant information

### 2. Search Existing Bugs
- Check GitHub issues for duplicates
- Check internal bug tracker
- If duplicate, add information to existing bug
- If new, proceed to create report

### 3. Create Bug Report
- Use the provided template
- Include all required information
- Attach screenshots/videos if applicable
- Provide steps to reproduce
- Submit to appropriate channel

### 4. Bug Triage
- QA team reviews bug report
- Severity and priority assigned
- Assigned to appropriate developer
- Added to sprint backlog if applicable

### 5. Bug Resolution
- Developer implements fix
- Unit tests created/updated
- Code review performed
- QA validates fix

### 6. Closure
- Bug marked as resolved
- Reporter notified
- Verified in production/staging
- Issue closed

---

## Bug Severity Levels

### Critical (P0)
**Definition**: System down, data loss, security breach

**Examples**:
- Application completely unavailable
- Data corruption or loss
- Security vulnerability exposed
- Payment processing failure
- Authentication/authorization completely broken

**SLA**: Fix within 4 hours
**Escalation**: Immediate to Tech Lead + DevOps

### High (P1)
**Definition**: Major feature broken, severe impact

**Examples**:
- Core feature non-functional
- Significant data inconsistency
- Performance severely degraded
- API endpoint returning errors
- Login issues for majority of users

**SLA**: Fix within 24 hours
**Escalation**: Within 4 hours to Tech Lead

### Medium (P2)
**Definition**: Feature broken with workaround, moderate impact

**Examples**:
- Non-core feature not working
- Minor performance issues
- UI/UX issues affecting usability
- Intermittent errors
- Workaround available

**SLA**: Fix within 1 week
**Escalation**: Within 2 days to Tech Lead

### Low (P3)
**Definition**: Minor issue, minimal impact

**Examples**:
- Cosmetic issues
- Typos in UI
- Minor documentation errors
- Edge case bugs
- Nice-to-have improvements

**SLA**: Fix within 2 weeks
**Escalation**: Within 1 week to Tech Lead

### Trivial (P4)
**Definition**: Very minor, no impact on functionality

**Examples**:
- Spelling errors
- Minor formatting issues
- Non-critical log messages
- Documentation improvements

**SLA**: Fix when time permits
**Escalation**: None unless requested

---

## Bug Report Template

### Basic Information

**Title**: [Short, descriptive title]

**Reporter**: [Your name/email]

**Date Reported**: [YYYY-MM-DD]

**Environment**:
- Application Version: [e.g., 1.0.0]
- Environment: [Production/Staging/Development]
- Browser/Platform: [e.g., Chrome 120, iOS 17]
- Device: [e.g., Desktop, iPhone 14]

---

### Bug Details

**Description**:
[Clear, concise description of the bug]

**Severity**: [Critical/High/Medium/Low/Trivial]

**Priority**: [P0/P1/P2/P3/P4]

---

### Steps to Reproduce

1. [First step]
2. [Second step]
3. [Third step]
4. [etc.]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

---

### Evidence

**Screenshots**:
[Attach screenshots showing the issue]

**Videos**:
[Attach video if the issue is hard to capture in screenshots]

**Logs**:
```
[Paste relevant error logs or console output]
```

**API Responses**:
```json
[Paste relevant API request/response if applicable]
```

---

### Additional Information

**Frequency**: [Always/Sometimes/Once]

**Workaround**: [Is there a workaround? If yes, describe it]

**Impact**: [How many users affected? Business impact?]

**Related Issues**: [Links to related bugs or features]

**Notes**: [Any other relevant information]

---

## Bug Lifecycle

### 1. New
- Bug report created
- Not yet reviewed
- Status: **New**

### 2. Triage
- QA team reviews bug
- Severity/priority assigned
- Added to appropriate sprint
- Status: **Triaged**

### 3. Assigned
- Developer assigned
- Bug added to workload
- Status: **Assigned**

### 4. In Progress
- Developer actively working
- Investigation/fix in progress
- Status: **In Progress**

### 5. In Review
- Fix implemented
- Ready for code review
- Status: **In Review**

### 6. QA Validation
- Code review approved
- QA testing fix
- Status: **In QA**

### 7. Resolved
- Fix validated by QA
- Ready for deployment
- Status: **Resolved**

### 8. Deployed
- Fix deployed to production
- Verified in production
- Status: **Deployed**

### 9. Closed
- Verified working
- No further action needed
- Status: **Closed**

### 10. Reopened
- Issue not fully resolved
- Needs additional work
- Status: **Reopened** → Back to **Assigned**

### 11. Won't Fix
- Issue valid but won't be fixed
- Documented reason
- Status: **Won't Fix**

### 12. Duplicate
- Same as existing bug
- Linked to original
- Status: **Duplicate**

---

## Bug Triage

### Triage Team
- **QA Lead**: Leads triage process
- **Tech Lead**: Provides technical guidance
- **Product Owner**: Prioritizes from business perspective

### Triage Meeting
- **Frequency**: Daily (standup) or Weekly (dedicated)
- **Duration**: 30 minutes
- **Attendees**: QA Lead, Tech Lead, Product Owner

### Triage Checklist
- [ ] Bug report reviewed
- [ ] Severity assigned
- [ ] Priority assigned
- [ ] Developer assigned
- [ ] Sprint selected
- [ ] Due date set (based on severity)
- [ ] Reporter notified

### Triage Criteria

**Assign Severity Based On**:
- Number of users affected
- Impact on core functionality
- Data loss/corruption risk
- Security implications
- Performance degradation

**Assign Priority Based On**:
- Business impact
- Customer complaints
- Upcoming releases
- Dependencies
- Resource availability

---

## Escalation Path

### Level 1: Developer
**Can Handle**: Most bugs, routine fixes
**Timeline**: Complete based on severity SLA
**Escalate If**: Cannot reproduce, needs architecture decision

### Level 2: Tech Lead
**Can Handle**: Complex bugs, architecture issues
**Timeline**: Provide guidance within 4 hours
**Escalate If**: Requires system design change, affects multiple teams

### Level 3: Engineering Manager
**Can Handle**: Resource conflicts, priority disputes
**Timeline**: Resolve within 1 day
**Escalate If**: Requires product decision, affects timeline significantly

### Level 4: Product Owner/CTO
**Can Handle**: Strategic decisions, major incidents
**Timeline**: Immediate for critical, 4 hours for high
**Escalate If**: Customer escalation, legal/compliance issue

### Escalation Triggers
- Bug not acknowledged within SLA
- No progress update in 24 hours
- Fix not ready by deadline
- QA rejects fix more than twice
- Customer escalates

---

## Bug Metrics

### Track These Metrics
- **Bug Count**: Total open bugs by severity
- **Bug Age**: How long bugs have been open
- **Fix Time**: Average time to resolve bugs
- **Reopen Rate**: Percentage of bugs that had to be reopened
- **Escape Rate**: Bugs found in production vs. pre-production

### Targets
- **Critical Bugs**: 0 in production
- **High Bugs**: <5 in production
- **Medium Bugs**: <20 in production
- **Average Fix Time**: <5 days
- **Reopen Rate**: <10%

---

## Best Practices

### For Reporters
- Be specific and descriptive
- Provide steps to reproduce
- Include screenshots/videos
- Check for duplicates first
- Use the template
- Follow up on questions

### For Developers
- Acknowledge bug receipt promptly
- Ask clarifying questions early
- Update bug status regularly
- Write tests to prevent regression
- Document fix in code
- Communicate workarounds if available

### For QA
- Triage bugs quickly
- Assign clear severity/priority
- Verify fixes thoroughly
- Test edge cases
- Update documentation
- Communicate with reporters

---

## Communication

### Bug Updates
- **Comment in Issue**: For all technical discussion
- **Slack**: For urgent questions (@mention)
- **Email**: For non-urgent updates to stakeholders
- **Standup**: Mention bugs blocking progress

### Reporter Notifications
- When bug is triaged
- When bug is assigned
- When fix is deployed
- When bug is closed

### Stakeholder Updates
- Daily: Critical/High bugs
- Weekly: All open bugs summary
- Monthly: Bug metrics and trends

---

## Tools

### Bug Tracking
- **GitHub Issues**: For external bugs
- **Jira**: For internal project management
- **Trello**: For Kanban board (optional)

### Screenshots/Screen Recording
- **macOS**: Cmd+Shift+4 (screenshot), Cmd+Shift+5 (record)
- **Windows**: Win+Shift+S (screenshot), Win+G (record)
- **Chrome DevTools**: For network requests, console errors

### Log Collection
- Application logs: `/var/log/tradingweb/`
- Browser console: F12 → Console tab
- Network logs: F12 → Network tab

---

## Examples

### Example 1: Critical Bug

**Title**: Application crashes on login after database migration

**Severity**: Critical

**Steps to Reproduce**:
1. Deploy latest version with migration
2. Navigate to login page
3. Enter valid credentials
4. Click login button

**Expected**: User is logged in successfully
**Actual**: Application crashes with 500 error

**Logs**:
```
Error: Column "users.new_field" does not exist
  at Query.runQuery (/app/node_modules/pg/lib/index.js:123:45)
```

**Impact**: All users unable to log in

**Workaround**: None

---

### Example 2: High Bug

**Title**: Stock chart displays incorrect data for AAPL

**Severity**: High

**Steps to Reproduce**:
1. Navigate to dashboard
2. Search for AAPL
3. View stock chart

**Expected**: Chart shows AAPL historical prices
**Actual**: Chart shows MSFT prices

**Impact**: Users see incorrect data for major stock

**Workaround**: View AAPL data in table format

---

### Example 3: Medium Bug

**Title**: Signal generation fails for stocks with <200 days of data

**Severity**: Medium

**Steps to Reproduce**:
1. Add newly listed stock (<200 days old)
2. Run signal generation job
3. Check job logs

**Expected**: Signal generated or graceful error
**Actual**: Job crashes with unhandled exception

**Impact**: Cannot generate signals for new stocks

**Workaround**: Wait until stock has 200+ days of data

---

## Contact

### Bug Report Submission
- **GitHub Issues**: https://github.com/your-org/tradingweb/issues
- **Email**: bugs@tradingweb.com
- **Slack**: #bug-reports

### Questions
- **QA Team**: qa@tradingweb.com
- **Tech Lead**: tech-lead@tradingweb.com

---

## Related Documents
- [Testing Checklist](./TESTING_CHECKLIST.md)
- [Quality Gate](./QUALITY_GATE.md)
- [Incident Response Plan](./INCIDENT_RESPONSE.md)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2024-01-25 | Initial version | QA Team |

---

Last Updated: 2024-01-25
