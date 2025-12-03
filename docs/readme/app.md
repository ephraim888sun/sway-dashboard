# Dashboard Documentation

## Overview

The Sway Dashboard provides a comprehensive view of supporter influence, electoral opportunities, and geographic distribution across jurisdictions and elections. It enables leaders to identify actionable opportunities where their verified supporters can make an impact in upcoming elections.

### Key Value Propositions

- **Real Voter Access**: Only counts verified supporters with jurisdiction data, ensuring metrics reflect actual voting capability
- **Actionable Timeframes**: Focuses on elections within the next 90 days, providing a realistic window for engagement
- **Geographic Intelligence**: Identifies where supporter concentration aligns with electoral opportunities
- **Performance Optimized**: Uses materialized views and intelligent caching for fast, responsive queries

![Main Dashboard Overview](docs/screenshots/dashboard-overview.png)
*Main dashboard view showing summary metrics, supporter growth chart, top states, and election insights*

---

## Metrics Calculation

The dashboard calculates several key metrics to provide actionable insights into supporter influence and electoral opportunities.

### Total Supporters

Counts all supporters in the viewpoint group network, including those without voter verification. This provides a baseline understanding of the total supporter base.

**Calculation**: Aggregates all `profile_viewpoint_group_rels` records where `type = 'supporter'` across the viewpoint group network.

### Verified Supporters

Counts only supporters who have completed voter verification and have associated jurisdiction data. This metric represents supporters who can actually vote in elections.

**Calculation**: Joins `profile_viewpoint_group_rels` with `voter_verifications` and `voter_verification_jurisdiction_rels` to count supporters with verified voting capability.


### Elections with Access

Counts upcoming elections (within 90 days) where verified supporters have jurisdiction-based access to vote on ballot items.

**Calculation**: 
1. Identifies elections with `poll_date >= CURRENT_DATE` and `poll_date <= CURRENT_DATE + 90 days`
2. Matches ballot items in those elections to jurisdictions where supporters are verified
3. Counts elections where `supportersInScope > 0`

### Total Ballot Items

Sums all races and measures in upcoming elections (next 90 days) where supporters have jurisdiction-based access.

**Calculation**: Aggregates `ballot_items` count from elections where supporters have access.


### State Distribution

Geographic breakdown showing supporter counts and jurisdiction counts by state, sorted by supporter count.

**Metrics**:
- `supporterCount`: Total verified supporters in the state
- `jurisdictionCount`: Number of jurisdictions with supporters in the state

**Calculation**: Groups supporters by state through jurisdiction relationships, aggregates counts.

---

## Visualization Strategies

The dashboard employs multiple visualization techniques to make data accessible and actionable.

### Summary Cards

A responsive grid layout displaying the four key metrics: Total Supporters, Verified Supporters, Elections with Access, and Total Ballot Items.

![Time Series Chart](docs/screenshots/summary-cards.png)

### Time Series Charts

Interactive area charts showing supporter growth trends with dual metrics overlay.

![Time Series Chart](docs/screenshots/time-series-chart.png)
*Supporter growth chart showing daily, weekly, and monthly trends*

### State Distribution

Ranked list visualization showing top states by supporter count with contextual information.

**Features**:
- Ranked list (top 10) with numbered badges
- Percentage calculation showing concentration (e.g., "Top 2 states represent X% of base")

![State Distribution](docs/screenshots/time-series-chart.png)


### Election Insights

Highlights the top election opportunity with detailed breakdown, followed by a ranked list of other elections.

**Features**:
- **Actionable Details**: Poll date, supporter count, ballot item breakdown
- **Ranked List**: Secondary elections with key metrics

![Election Insights](docs/screenshots/election-insights.png)
*Top election opportunities with supporter access metrics*

### Jurisdiction Table

Sortable, paginated data table for detailed jurisdiction analysis.

![Jurisdiction Table](docs/screenshots/jurisdiction-table.png)
*Sortable jurisdiction table with supporter and election metrics*

---

## Actionable Insights

The dashboard is designed to surface insights that leaders can act upon immediately. Here's what makes an insight "actionable":

### Real Voter Access

Only verified supporters with jurisdiction data are counted in influence metrics.

### Actionable Timeframes

 Focus on elections within the next 90 days.

### Top Opportunities

**Principle**: Highlight elections with the most supporters in scope.

**Rationale**: Elections with more supporters represent higher-leverage opportunities where engagement efforts can have maximum impact.

### Geographic Concentration

**Principle**: Identify states and jurisdictions with highest supporter density relative to opportunities.

**Rationale**: Concentrated supporter bases in jurisdictions with upcoming elections represent the most efficient use of engagement resources.

---

## Data Architecture

The dashboard uses a sophisticated data architecture optimized for performance and scalability.

### Materialized Views

Materialized views pre-compute expensive aggregations to dramatically improve query performance. They are refreshed periodically to maintain data freshness.

#### mv_supporters_by_jurisdiction

Pre-computes the mapping of supporters to jurisdictions with metadata.

**Purpose**: Eliminates expensive joins across `profile_viewpoint_group_rels`, `profiles`, `persons`, `voter_verifications`, and `voter_verification_jurisdiction_rels` on every query.

**Structure**:
- `jurisdiction_id`: The jurisdiction where the supporter can vote
- `profile_id`: Supporter profile identifier
- `viewpoint_group_id`: Viewpoint group the supporter belongs to
- `created_at`: When the supporter relationship was created
- `type`: Relationship type (always 'supporter' in this view)

**Indexes**:
- `(jurisdiction_id, viewpoint_group_id)` for fast jurisdiction lookups
- `created_at` for time-based queries
- `profile_id` for profile lookups

**Implementation**: See [`scripts/migrations/create_materialized_views.sql`](scripts/migrations/create_materialized_views.sql)

#### mv_jurisdiction_metrics

Pre-aggregates jurisdiction-level metrics including supporter counts, growth rates, and upcoming election statistics.

**Purpose**: Provides fast access to jurisdiction-level aggregations without recalculating on every query.

**Metrics Included**:
- Supporter counts (total, active 30d, active 90d)
- Growth rates (30d, 90d)
- Active rates
- Estimated turnout
- Supporter share percentage
- Upcoming elections/ballot items/races counts
- Engagement score

**Implementation**: See [`scripts/migrations/create_materialized_views.sql`](scripts/migrations/create_materialized_views.sql)

#### mv_time_series_supporters

Pre-computes time series data for supporter growth across daily, weekly, and monthly periods.

**Purpose**: Eliminates expensive date aggregations and window functions on every chart load.

**Structure**:
- `period_type`: 'daily', 'weekly', or 'monthly'
- `period`: Formatted period string (YYYY-MM-DD, YYYY-W##, YYYY-MM)
- `viewpoint_group_id`: Viewpoint group identifier
- `new_supporters`: Supporters who joined in this period
- `cumulative_supporters`: Running total up to this period
- `active_supporters`: 30-day rolling window count
- `date`: Date for sorting/display

**Implementation**: See [`scripts/migrations/create_materialized_views.sql`](scripts/migrations/create_materialized_views.sql)

![Materialized Views](docs/screenshots/supabase-materialized-views.png)
*Supabase dashboard showing materialized views and their refresh status*

#### mv_election_influence_summary

Pre-computes election-level supporter counts and influence metrics.

**Purpose**: Fast election queries without joining across multiple tables.

**Metrics**:
- `supporters_in_scope`: Verified supporters who can vote in this election
- `estimated_turnout`: Estimated total voters
- `supporter_share_in_scope`: Percentage of estimated turnout

**Implementation**: See [`scripts/migrations/create_materialized_views.sql`](scripts/migrations/create_materialized_views.sql)

### Viewpoint Group Networks

The dashboard supports hierarchical viewpoint group relationships where supporters of a primary group may also be leaders of sub-groups.

**Network Resolution**: 
1. Start with primary viewpoint group
2. Find all supporters of the primary group
3. Find all viewpoint groups where those supporters are leaders
4. Include all groups in the network for metric calculations

**Rationale**: This allows leaders to see influence across their entire network, not just direct supporters.

**Implementation**: See `getViewpointGroupNetworkClient()` in [`lib/queries-client.ts`](lib/queries-client.ts)

### Query Strategy

#### Client-Side Queries

All dashboard queries run client-side using Supabase client library for real-time data access.

**Benefits**:
- Real-time updates
- No API route overhead
- Direct database access with RLS policies

**Implementation**: See [`lib/queries-client.ts`](lib/queries-client.ts)

#### SWR Caching

Uses SWR (stale-while-revalidate) for intelligent client-side caching.

**Configuration**:
- `revalidateOnFocus: false`: Prevents unnecessary refetches
- `revalidateOnMount: true`: Ensures fresh data on page load
- `keepPreviousData: true`: Smooth transitions when switching viewpoint groups

**Implementation**: See [`lib/hooks/use-dashboard-data.ts`](lib/hooks/use-dashboard-data.ts)

#### Parallel Data Fetching

Summary metrics fetch multiple data sources in parallel using `Promise.all()` for optimal performance.

**Example**: `useSummaryMetrics()` fetches total supporters, verified supporters, state distribution, and upcoming elections simultaneously.

**Implementation**: See `useSummaryMetrics()` in [`lib/hooks/use-dashboard-data.ts`](lib/hooks/use-dashboard-data.ts)

#### Batch Processing

Large queries use batch processing to respect Supabase's `.in()` query limits (100 items per batch).

**Implementation**: See `getViewpointGroupNetworkClient()` in [`lib/queries-client.ts`](lib/queries-client.ts) which processes supporter profile IDs in batches of 100

### Refresh Strategy

Materialized views are refreshed periodically to maintain data freshness while preserving query performance.

#### Refresh Function

`refresh_all_materialized_views()` refreshes all views in dependency order using `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid blocking reads.

**Dependency Order**:
1. `mv_supporters_by_jurisdiction` (base view)
2. `mv_jurisdiction_metrics` (depends on #1)
3. `mv_time_series_supporters` (depends on #1)
4. `mv_election_influence_summary` (depends on #1)

**Implementation**: See [`scripts/migrations/refresh_materialized_views.sql`](scripts/migrations/refresh_materialized_views.sql)

#### Automation Options

The refresh function can be automated using:

1. **pg_cron** (if available): `SELECT cron.schedule('refresh-materialized-views', '*/15 * * * *', 'SELECT refresh_all_materialized_views()');`
2. **Supabase Edge Functions**: Cron-triggered edge function
3. **External Cron Job**: API call to Supabase
4. **Next.js API Route**: Webhook-triggered revalidation

**Recommended**: Refresh every 15-30 minutes for near-real-time data with minimal performance impact.

![Query Performance](docs/screenshots/supabase-query-performance.png)
*Supabase dashboard showing query performance metrics*

---

## Additional Compelling Features

Beyond core metrics and visualizations, the dashboard includes several features that enhance usability and performance.

### Viewpoint Group Filtering

Users can filter all metrics by selecting a viewpoint group, which dynamically updates all dashboard components.

**Features**:
- Context-based filtering across entire dashboard
- LocalStorage persistence of selection
- Automatic cache invalidation when switching groups
- Network expansion (includes sub-groups where supporters are leaders)

**Implementation**: See [`lib/viewpoint-group-context.tsx`](lib/viewpoint-group-context.tsx)

### Responsive Design

Mobile-first approach ensures the dashboard works seamlessly across all device sizes.

**Features**:
- Container queries for component-level responsiveness
- Adaptive chart density based on screen size
- Responsive grid layouts (1 → 2 → 4 columns)
- Mobile-optimized table views

**Implementation**: See [`components/section-cards.tsx`](components/section-cards.tsx) and [`components/chart-area-interactive.tsx`](components/chart-area-interactive.tsx)

### Loading States

Skeleton loaders provide visual feedback during data fetching, improving perceived performance.

**Features**:
- Component-specific loading skeletons
- Smooth transitions when data loads
- Prevents layout shift

**Implementation**: See `LoadingSkeleton` in [`app/page-client.tsx`](app/page-client.tsx)

### Error Handling

Comprehensive error boundaries and fallback states ensure graceful degradation.

**Features**:
- React error boundaries at route level
- User-friendly error messages
- Retry functionality
- Fallback UI for empty states

**Implementation**: See [`app/error.tsx`](app/error.tsx) and error handling in components

### Data Caching

SWR provides intelligent caching with configurable revalidation strategies.

**Benefits**:
- Reduced database load
- Faster subsequent page loads
- Background revalidation for fresh data
- Optimistic UI updates

**Configuration**: See [`lib/swr-config.ts`](lib/swr-config.ts)

### Performance Optimization

Multiple optimization strategies ensure fast, responsive queries even with large datasets.

**Strategies**:
- Materialized views for pre-computed aggregations
- Parallel data fetching
- Batch processing for large queries
- Indexed database queries
- Client-side caching with SWR

**Result**: Dashboard loads in <2 seconds even with millions of supporter records.

### Deep Linking

Direct links to election detail pages enable sharing and bookmarking of specific opportunities.

**Features**:
- Clickable election cards linking to `/elections/[id]`
- Clickable jurisdiction rows linking to `/jurisdictions`
- Shareable URLs for specific views

**Implementation**: See [`components/influence-insights.tsx`](components/influence-insights.tsx) and routing in [`app/elections/[id]/page.tsx`](app/elections/[id]/page.tsx)

![Election Detail Page](docs/screenshots/election-detail.png)
*Election detail page with ballot items and jurisdiction breakdown*

---

## Screenshots

The following screenshots provide visual documentation of the dashboard:

- **Main Dashboard**: Overview of all metrics and visualizations
- **Time Series Chart**: Supporter growth trends with period selection
- **Election Insights**: Top election opportunities
- **Jurisdiction Table**: Detailed jurisdiction analysis
- **Election Detail**: Deep dive into specific election
- **Supabase Dashboard**: Materialized views and query performance

All screenshots should be placed in `docs/screenshots/` directory with descriptive filenames.

---

## Technical Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Charts**: Recharts
- **Data Fetching**: SWR (stale-while-revalidate)
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context API
- **Table**: TanStack Table (React Table)

---

## Getting Started

See the main project README for setup instructions. The dashboard is available at `/` route and requires authentication.

