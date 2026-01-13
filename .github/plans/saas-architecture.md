# AIReady SaaS Architecture & Monetization Plan

> **Reference this document for SaaS platform design, data models, and revenue strategy**

## 🎯 Product Vision

**AIReady transforms static code analysis into continuous AI-readiness optimization.**

### Core Value Proposition

**Free CLI:** One-time snapshots showing current problems
**Pro SaaS:** Historical trends, benchmarks, automated recommendations
**Enterprise:** CI/CD integration, team analytics, custom rules

## 🏗️ Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │  Dashboard    │  │  Visualizations│  │  Settings      │  │
│  │  - Trends     │  │  - D3.js graphs│  │  - Thresholds  │  │
│  │  - Benchmarks │  │  - Heatmaps    │  │  - Integrations│  │
│  └───────────────┘  └───────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Node.js/Express)             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Auth      │  │  Analysis  │  │  Webhooks  │            │
│  │  - JWT     │  │  - Upload  │  │  - GitHub  │            │
│  │  - OAuth   │  │  - Process │  │  - Slack   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Users     │  │  Analysis  │  │  Metrics   │            │
│  │  Teams     │  │  Results   │  │  Timeseries│            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Storage (S3/CloudFlare R2)                 │
│  - Raw analysis JSON files                                   │
│  - Generated reports (HTML/PDF)                              │
│  - Visualization data (cached)                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
CLI Tool (Local)
    ↓ analyze codebase
    ↓ generate JSON
    ↓ POST /api/analysis/upload
        ↓
    API Server
        ↓ validate JWT
        ↓ parse JSON
        ↓ extract metrics
        ↓ store in PostgreSQL
        ↓ store raw JSON in S3
        ↓ trigger async jobs
            ↓
        Background Workers
            ↓ calculate trends
            ↓ compute benchmarks
            ↓ generate recommendations
            ↓ send notifications
                ↓
            WebSocket Server
                ↓ push updates to dashboard
                    ↓
                Browser (Real-time)
```

## 📊 Database Schema

### Core Tables

```sql
-- Users and authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 of token
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams and organizations
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL, -- 'free', 'pro', 'enterprise'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Repositories
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  git_url TEXT,
  default_branch VARCHAR(100) DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (team_id, name)
);

-- Analysis runs (core data)
CREATE TABLE analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  tool VARCHAR(50) NOT NULL, -- 'pattern-detect', 'context-analyzer', 'consistency'
  version VARCHAR(20) NOT NULL, -- CLI tool version
  commit_sha VARCHAR(40),
  branch VARCHAR(255),
  triggered_by UUID REFERENCES users(id),
  status VARCHAR(50) NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  raw_data_url TEXT, -- S3 URL to full JSON
  summary JSONB, -- Quick access to key metrics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  INDEX idx_repo_tool_created (repository_id, tool, created_at DESC)
);

-- Pattern detection metrics (timeseries)
CREATE TABLE pattern_metrics (
  id BIGSERIAL PRIMARY KEY,
  analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Summary metrics
  total_files INT NOT NULL,
  total_patterns INT NOT NULL,
  total_token_cost INT NOT NULL,
  
  -- By pattern type
  api_handler_count INT,
  validator_count INT,
  utility_count INT,
  component_count INT,
  
  -- Top duplicates (JSON array)
  top_duplicates JSONB,
  
  INDEX idx_analysis_timestamp (analysis_run_id, timestamp)
);

-- Context analyzer metrics (timeseries)
CREATE TABLE context_metrics (
  id BIGSERIAL PRIMARY KEY,
  analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Summary metrics
  total_files INT NOT NULL,
  avg_import_depth DECIMAL(5,2),
  max_import_depth INT,
  avg_context_budget INT,
  max_context_budget INT,
  
  -- Fragmentation
  avg_fragmentation DECIMAL(3,2),
  avg_cohesion DECIMAL(3,2),
  fragmented_domains JSONB, -- Array of domains with scores
  
  -- Circular dependencies
  circular_dependency_count INT,
  
  INDEX idx_analysis_timestamp (analysis_run_id, timestamp)
);

-- Consistency metrics (timeseries)
CREATE TABLE consistency_metrics (
  id BIGSERIAL PRIMARY KEY,
  analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Summary metrics
  total_files INT NOT NULL,
  total_issues INT NOT NULL,
  consistency_score DECIMAL(3,2), -- 0-1 scale
  
  -- Issue breakdown
  naming_issues INT NOT NULL,
  pattern_issues INT NOT NULL,
  architecture_issues INT DEFAULT 0,
  
  -- Severity distribution
  critical_count INT DEFAULT 0,
  major_count INT DEFAULT 0,
  minor_count INT DEFAULT 0,
  info_count INT DEFAULT 0,
  
  -- Issue type details
  naming_convention_violations INT DEFAULT 0, -- snake_case in JS/TS
  poor_naming_count INT DEFAULT 0, -- single letters, unclear
  unclear_booleans INT DEFAULT 0, -- missing is/has/can
  unclear_functions INT DEFAULT 0, -- missing action verbs
  
  -- Pattern inconsistencies
  error_handling_inconsistencies INT DEFAULT 0,
  async_pattern_inconsistencies INT DEFAULT 0,
  import_style_inconsistencies INT DEFAULT 0,
  
  -- Top issues (JSON array)
  top_issues JSONB,
  
  INDEX idx_analysis_timestamp (analysis_run_id, timestamp)
);

-- File-level details (for drill-down)
CREATE TABLE file_metrics (
  id BIGSERIAL PRIMARY KEY,
  analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  tool VARCHAR(50) NOT NULL,
  
  -- Common metrics
  token_cost INT,
  lines_of_code INT,
  
  -- Pattern-detect specific
  pattern_type VARCHAR(50),
  similarity_score DECIMAL(3,2),
  
  -- Context-analyzer specific
  import_depth INT,
  context_budget INT,
  cohesion_score DECIMAL(3,2),
  fragmentation_score DECIMAL(3,2),
  
  metrics_json JSONB, -- Full metrics object
  
  INDEX idx_file_path (analysis_run_id, file_path)
);

-- Recommendations
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'consolidation', 'refactoring', 'architecture'
  severity VARCHAR(50) NOT NULL, -- 'critical', 'major', 'minor', 'info'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_files JSONB, -- Array of file paths
  estimated_savings INT, -- Token savings
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in-progress', 'completed', 'wont-fix'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_status (analysis_run_id, status)
);

-- Billing
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Hypertables for Timeseries (TimescaleDB Extension)

```sql
-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert to hypertables for efficient time-series queries
SELECT create_hypertable('pattern_metrics', 'timestamp');
SELECT create_hypertable('context_metrics', 'timestamp');
SELECT create_hypertable('consistency_metrics', 'timestamp');

-- Retention policy: keep detailed data for 90 days
SELECT add_retention_policy('pattern_metrics', INTERVAL '90 days');
SELECT add_retention_policy('context_metrics', INTERVAL '90 days');
SELECT add_retention_policy('consistency_metrics', INTERVAL '90 days');

-- Continuous aggregates for dashboards (pre-computed views)
CREATE MATERIALIZED VIEW daily_pattern_summary
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', timestamp) AS day,
  repository_id,
  AVG(total_patterns) as avg_patterns,
  AVG(total_token_cost) as avg_token_cost,
  MAX(total_patterns) as max_patterns
FROM pattern_metrics pm
JOIN analysis_runs ar ON pm.analysis_run_id = ar.id
GROUP BY day, repository_id;

-- Refresh policy: update every hour
SELECT add_continuous_aggregate_policy('daily_pattern_summary',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');
```

## 🔐 Authentication & Authorization

### JWT-Based Auth

```typescript
// Token payload
interface JWTPayload {
  userId: string;
  email: string;
  teams: Array<{
    teamId: string;
    role: 'owner' | 'admin' | 'member';
  }>;
  plan: 'free' | 'pro' | 'enterprise';
  iat: number;
  exp: number;
}

// Middleware
function requireAuth(requiredPlan?: 'pro' | 'enterprise') {
  return async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      
      if (requiredPlan && !hasAccessToPlan(payload.plan, requiredPlan)) {
        return res.status(403).json({ error: 'Upgrade required' });
      }
      
      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
```

### OAuth Integration

**Supported Providers:**
- GitHub (primary - repo access)
- Google (email-based)
- Microsoft (enterprise customers)

## 📡 API Endpoints

### Analysis Upload

```typescript
POST /api/analysis/upload
Authorization: Bearer <jwt>
Content-Type: application/json

Request Body:
{
  "tool": "pattern-detect" | "context-analyzer" | "consistency",
  "version": "0.8.1",
  "repository": "owner/repo",
  "commit": "abc123",
  "branch": "main",
  "results": {
    // Full analysis JSON from CLI
  }
}

Response:
{
  "analysisId": "uuid",
  "status": "processing",
  "estimatedTime": 30, // seconds
  "dashboardUrl": "https://app.aiready.dev/repos/:id/analysis/:analysisId"
}
```

### Metrics Query

```typescript
GET /api/repos/:repoId/metrics?tool=pattern-detect&from=2026-01-01&to=2026-01-14
Authorization: Bearer <jwt>

Response:
{
  "data": [
    {
      "timestamp": "2026-01-01T00:00:00Z",
      "totalPatterns": 23,
      "totalTokenCost": 8500,
      "byType": {
        "api-handler": 12,
        "validator": 8,
        "utility": 3
      }
    },
    // ... more data points
  ],
  "summary": {
    "avgPatterns": 21.5,
    "trend": "decreasing", // or "increasing", "stable"
    "changePercent": -8.5
  }
}

// Consistency metrics
GET /api/repos/:repoId/metrics?tool=consistency&from=2026-01-01&to=2026-01-14
Authorization: Bearer <jwt>

Response:
{
  "data": [
    {
      "timestamp": "2026-01-01T00:00:00Z",
      "totalIssues": 45,
      "consistencyScore": 0.82,
      "namingIssues": 26,
      "patternIssues": 15,
      "architectureIssues": 4,
      "bySeverity": {
        "critical": 2,
        "major": 8,
        "minor": 20,
        "info": 15
      },
      "topIssueTypes": {
        "snake_case_violations": 12,
        "poor_naming": 8,
        "error_handling_mix": 5,
        "async_pattern_mix": 3
      }
    },
    // ... more data points
  ],
  "summary": {
    "avgIssues": 42.5,
    "avgConsistencyScore": 0.84,
    "trend": "improving", // or "degrading", "stable"
    "changePercent": -6.7 // negative = fewer issues (good)
  }
}
```

### Recommendations

```typescript
GET /api/repos/:repoId/recommendations?status=open&severity=critical
Authorization: Bearer <jwt>

Response:
{
  "recommendations": [
    {
      "id": "uuid",
      "type": "consolidation",
      "severity": "critical",
      "title": "Consolidate 12 scattered user management files",
      "description": "...",
      "affectedFiles": ["src/user/get.ts", "..."],
      "estimatedSavings": 3200, // tokens
      "status": "open",
      "createdAt": "2026-01-14T10:00:00Z"
    }
  ]
}
```

## 💰 Pricing Tiers

### Free Tier
**Price:** $0/month
**Limits:**
- 1 team
- 3 repositories
- 10 analysis runs/month
- 7-day data retention
- CLI access only
- JSON/HTML export

**Value Prop:** Try before you buy, personal projects

### Pro Tier
**Price:** $49/month
**Includes:**
- Everything in Free
- Unlimited repositories
- Unlimited analysis runs
- 90-day data retention
- Historical trends & charts
- Team benchmarks
- 5 AI-generated refactoring plans/month
- Slack/Discord webhooks
- Email support

**Value Prop:** Teams serious about code quality

### Enterprise Tier
**Price:** Custom (starts at $499/month)
**Includes:**
- Everything in Pro
- Unlimited teams/users
- Unlimited refactoring plans
- 1-year+ data retention
- CI/CD integration (GitHub Actions, GitLab CI)
- Custom thresholds & rules
- API access for custom integrations
- Dedicated account manager
- Priority support (SLA)
- On-premise deployment option

**Value Prop:** Large organizations, compliance requirements

### Add-Ons
- **Extra repositories** (Pro): $5/repo/month
- **Extended retention** (Pro): $10/month per 90 days
- **White-label reports** (Enterprise): $100/month

## 📈 Revenue Model

### Target Metrics (Year 1)

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Free users | 500 | 2,000 | 10,000 |
| Pro subscribers | 15 | 50 | 200 |
| Enterprise deals | 0 | 2 | 10 |
| MRR | $735 | $3,450 | $14,800 |
| ARR | $8,820 | $41,400 | $177,600 |

### Conversion Funnel

```
10,000 Free Users (100%)
    ↓ 3% convert to Pro
300 Pro Trials
    ↓ 67% retain after trial
200 Pro Subscribers ($9,800 MRR)
    ↓ 5% upgrade to Enterprise
10 Enterprise Deals ($5,000+ MRR)
    ↓
Total: $14,800 MRR = $177,600 ARR
```

### Customer Acquisition

**Organic:**
- npm package downloads → website
- GitHub stars/trending
- Dev.to / Hacker News posts
- Technical blog (SEO)

**Paid:**
- Google Ads (keywords: "code quality", "AI code tools")
- LinkedIn sponsored content (targeting CTOs, engineering managers)
- Conference sponsorships (React Summit, Node Congress)

**Partnerships:**
- GitHub Marketplace listing
- Copilot plugin marketplace
- VS Code extension recommendations

### Retention Strategy

**Prevent Churn:**
- Weekly email: "Your code quality improved 12% this week"
- In-app notifications: "New fragmentation detected"
- Quarterly business reviews (Enterprise)

**Expansion Revenue:**
- Usage-based pricing for extra repos
- Upsell: Free → Pro (show locked features)
- Cross-sell: Pro → Enterprise (team growth triggers)

## 🚀 Go-to-Market Strategy

### Phase 1: Launch (Months 1-3)
- ✅ Launch pattern-detect CLI (done)
- ✅ Launch context-analyzer CLI (done)
- 🔜 Build MVP SaaS platform
- 🔜 Onboard 50 beta users
- 🔜 Product Hunt launch
- 🔜 First paid customer

### Phase 2: Growth (Months 4-6)
- Launch refactoring plan generator (AI-powered)
- Add CI/CD integrations
- 50 Pro subscribers
- 2 Enterprise pilots
- Content marketing (case studies, blog posts)

### Phase 3: Scale (Months 7-12)
- Launch team collaboration features
- Add real-time monitoring
- 200 Pro subscribers
- 10 Enterprise customers
- Conference talks & sponsorships
- Partner with AI coding tool vendors

## 🎨 UI/UX Wireframes

### Dashboard Home

```
┌────────────────────────────────────────────────────────────┐
│ AIReady                    [Search]   [Repos ▾]  [Profile] │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  My Repositories                        [+ Add Repository]  │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  owner/repo-a    │  │  owner/repo-b    │               │
│  │  ▶ 23 patterns   │  │  ▶ 15 patterns   │               │
│  │  ▼ 8.5% (↓ good) │  │  ▲ 12% (↑ bad)   │               │
│  │  Last: 2h ago    │  │  Last: 1d ago    │               │
│  │  [View →]        │  │  [View →]        │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  Quick Insights                                              │
│  • 3 critical issues need attention                         │
│  • Your average duplication decreased 15% this month 🎉     │
│  • Recommendation: Consolidate user management module       │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Repository Detail

```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Repos     owner/repo-name     [Settings]  [Share]│
├────────────────────────────────────────────────────────────┤
│  [Overview] [Patterns] [Context] [Consistency] [Recs] [CI] │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  Pattern Detection                          Last run: 2h ago│
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📊 Trend Chart (30 days)                           │   │
│  │     │                                                │   │
│  │  30 │     •                                          │   │
│  │  25 │   •   •   •                                    │   │
│  │  20 │ •           •     •                            │   │
│  │  15 │                 •   •   •                      │   │
│  │     └────────────────────────────────────────        │   │
│  │      Jan 1      Jan 7      Jan 14                    │   │
│  │                                                       │   │
│  │  Current: 23 patterns (-8.5% vs last week)           │   │
│  │  Token cost: 8,500 (-12% vs last week)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Breakdown by Type                                           │
│  ┌────────────┬───────┬───────────┬──────────┐             │
│  │ Type       │ Count │ Avg Sim   │ Tokens   │             │
│  ├────────────┼───────┼───────────┼──────────┤             │
│  │ API Handler│  12   │ 87%  🔴  │  3,200   │             │
│  │ Validator  │   8   │ 78%  🟠  │  2,100   │             │
│  │ Utility    │   3   │ 65%  🟡  │    900   │             │
│  └────────────┴───────┴───────────┴──────────┘             │
│                                                              │
│  [View Detailed Report →]  [Run New Analysis]               │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Consistency Analysis View

```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Repos     owner/repo-name     [Settings]  [Share]│
├────────────────────────────────────────────────────────────┤
│  [Overview] [Patterns] [Context] [Consistency] [Recs] [CI] │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  Consistency Score: 87%                    Last run: 3h ago │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📈 Score Trend (30 days)                           │   │
│  │     │                                                │   │
│  │ 100 │                       • • •                    │   │
│  │  90 │             • • •   •                          │   │
│  │  80 │       • •                                      │   │
│  │  70 │   • •                                          │   │
│  │     └────────────────────────────────────────        │   │
│  │      Jan 1      Jan 7      Jan 14     Jan 21        │   │
│  │                                                       │   │
│  │  Current: 87% (+9% vs last week) ✅                  │   │
│  │  Total issues: 42 (-15 vs last week)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Issue Breakdown by Category                                │
│  ┌──────────────────┬───────┬─────────┬──────────┐         │
│  │ Category         │ Count │ Trend   │ Severity │         │
│  ├──────────────────┼───────┼─────────┼──────────┤         │
│  │ Naming Quality   │  24   │ ↓ -8    │ 🔴3 🟠21 │         │
│  │ Pattern Inconsist│  15   │ ↓ -5    │ 🔴0 🟠12 │         │
│  │ Architecture     │   3   │ ↓ -2    │ 🔴1 🟠2  │         │
│  └──────────────────┴───────┴─────────┴──────────┘         │
│                                                              │
│  Top Issues Needing Attention                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 Critical: Mixed error handling patterns          │   │
│  │    src/api/auth.ts, src/api/users.ts (8 files)     │   │
│  │    [View Details →]                                 │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🟠 Major: Single-letter variable names             │   │
│  │    src/utils/parser.ts:42, 58, 91 (12 instances)   │   │
│  │    [View Details →]                                 │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🟠 Major: Unclear boolean names                     │   │
│  │    src/models/user.ts:15 (7 instances)             │   │
│  │    [View Details →]                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Consistency Patterns Detected                              │
│  ✅ Error handling: try-catch used in 85% of async code    │
│  ✅ Import style: ES modules used consistently              │
│  ⚠️  Naming: Mixed camelCase/snake_case in 12% of files    │
│  ⚠️  Async patterns: Callbacks still used in legacy code   │
│                                                              │
│  [View Detailed Report →]  [Run New Analysis]               │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** D3.js, Chart.js, Plotly.js
- **State:** Zustand + TanStack Query
- **Auth:** NextAuth.js

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL 16 + TimescaleDB
- **Cache:** Redis
- **Storage:** AWS S3 / CloudFlare R2
- **Queue:** BullMQ (Redis-based)

### Infrastructure
- **Hosting:** Vercel (frontend) + Railway/Fly.io (backend)
- **CDN:** CloudFlare
- **Monitoring:** Sentry (errors) + Plausible (analytics)
- **Email:** Resend
- **Payments:** Stripe

## 📝 Next Steps

### Immediate (Month 1)
- [ ] Set up Next.js project with authentication
- [ ] Design database schema (PostgreSQL)
- [ ] Build analysis upload API endpoint
- [ ] Create basic dashboard UI
- [ ] Implement JWT auth flow

### Short-term (Months 2-3)
- [ ] Add historical trend charts
- [ ] Build recommendation system
- [ ] Stripe integration for billing
- [ ] Email notifications
- [ ] Beta user onboarding

### Long-term (Months 4-12)
- [ ] CI/CD integrations
- [ ] Real-time WebSocket updates
- [ ] Team collaboration features
- [ ] AI-powered refactoring plans
- [ ] Enterprise features (SSO, RBAC)

---

**Status:** Planning phase. CLI tools operational, SaaS platform in design.
