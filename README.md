# Implementation Approach

- Clarify the core questions the dashboard must answer
- Define the metrics and data model to support those questions
- Design the UX: pages, sections, charts, and flows
- Implement: how you’d structure the Next.js app + APIs + calculations

## 1. Questions
For this product, the leader really cares about:

- Where do I have real political leverage right now?
- How is my influence changing over time?
- In which upcoming elections or races can I actually matter?
- What should I do next (and where) to increase impact?

So the dashboard should guide them through:
- A summary of their current influence.
- A trend view: how it’s changing.
- A contextual view: geography and elections.
- A call-to-action: where to focus.

Keep this mental model: each screen/section should answer one of those questions obviously.

## 2. Define metrics and how to compute them
Use the dataset you have (leader, supporters, jurisdictions, elections, races, measures, influence targets).

Core metrics
You already have three strong pillars:

- Supporters per Jurisdiction & % of Electorate
- Supporter Growth Over Time
- Active Supporter Rate

 1. Supporters per Jurisdiction & % of Electorate
Represents political leverage in a place.

Conceptual computation:

Take all verified supporters of this leader.
Map each to one or more jurisdiction_id via voter verification.
Aggregate:
supporter_count_j = count(supporters in jurisdiction j)
estimated_turnout_j (external or assumed)
supporter_share_j = supporter_count_j / estimated_turnout_j

 2. Supporter Growth Over Time
Shows momentum.

Conceptual computation:

For each supporter, use created_at or first_seen_at.
Bucket by week/month.
Metrics:
new_supporters_t
cumulative_supporters_t

3. Active Supporter Rate
Shows engagement depth, not just size.

Conceptual computation:

Define “active” as any recorded engagement in last X days (events, actions, etc. — you’ll need to infer or mock from available timestamps).
Per time window:
active_supporters = distinct supporters with activity in last X days
active_rate = active_supporters / total_supporters

### Contextual / comparative metrics
You need at least one metric that varies by location or election.

Good ones:

1. Influence by Jurisdiction (comparative)

For each jurisdiction:
supporter_share_j
active_rate_j
trend_j (supporter growth in last 30 days)

2. Influence by Upcoming Election

For each election in the next N days:
total_supporters_in_election_scope
supporter_share_in_scope
Count of influence targets in that election aligned with leader’s viewpoint groups.

3. Race/Measure Influence Score

For each race/measure tagged as an influence target for this leader’s viewpoints:
supporters_in_relevant_jurisdiction(s)
supporter_share_of_turnout
Combined into a simple influence_score (0–100) so they can rank opportunities.

The exact formulas can be simple; what matters is that they’re interpretable and consistent.

## 3. UX design: what the dashboard should look like
Think in three main views:

### A. Overview page (default)
Goal: immediate answer to “How strong is my influence right now, and where?”

Sections:

1. Top-level summary cards
At the top, 3–4 “hero” metrics:

Total Supporters
Active Supporters (last 30 days) + % Active
Top Jurisdiction by Share e.g. “District 5: 4,200 supporters ≈ 7.8% of turnout”
High-Leverage Upcoming Elections e.g. “3 elections in next 90 days where you’re ≥5% of expected turnout”
Each card can include a tiny sparkline (trend over last 90 days).

2. Influence over time chart
A main line chart with:

X-axis: time (weekly or monthly)
Lines:
total supporters
active supporters
Optional: area highlighting big jumps or plateaus.
This fulfills the “change over time” requirement and gives a gut sense of growth.

3. Influence by geography (comparative)
A table or choropleth-style map (MVP: table + bar chart):

Columns:
jurisdiction name
supporter_count
supporter_share_of_turnout
active_rate
30-day growth %
Default sort by supporter_share_of_turnout or growth.
This answers “Where are my strongholds vs. growth markets?”

### B. Elections & races view
Goal: tie influence to specific political events (where they can act).

1. Upcoming elections list
For elections in next N days:

Election name, date, scope.
supporters_in_scope
supporter_share_in_scope
# of influence targets (races/measures) relevant to your viewpoints.
Clicking into an election shows:

2. Election detail
Short summary: “You have 4,200 supporters in this election’s area (~6.3% of typical turnout).”
List of key races/measures (influence targets):
race/measure name
office / topic tags (via viewpoint groups)
jurisdiction
your influence_score
A call-to-action style insight:
“Top 3 races where your base could be decisive.”

### C. Jurisdictions view
Goal: more “geo-ops”-style view.

Table (or segmented controls) listing:
strongholds (high share, high active)
sleeping giants (high count, low active)
emerging markets (low count but high growth)
Each row links to a breakdown: timeline of growth, upcoming elections in that jurisdiction, and relevant influence targets.

## 4. Making insights “actionable”
Actionable means: they can clearly see a next step.

Design your summaries like this:

Instead of:

“You have 3,472 supporters in District 5.”
Prefer:

“You have 3,472 supporters in District 5, ≈6.1% of typical turnout. A city council race you care about is in 27 days here. This is a high-leverage opportunity.”
Concretely:

Highlight “High Leverage Opportunities”

Condition: supporter_share > threshold AND election in next X days.
Show a short list with rank, and a “why this matters” tag (e.g. Climate, Housing from viewpoint groups).
Highlight “Wake-up Zones”

Many supporters but active_rate < threshold.
Suggest: “Re-engage your base here before Election Y.”
Highlight “Growth Hotspots”

High growth % last 30 days.
Suggest: “Your community is growing fastest in Z; consider focusing your next push there.”
Even if you don’t implement actual messaging tools, the phrasing of sections and metric groupings should hint: this is where you’d go do something.

## 5. Implementation approach (Next.js + TypeScript)
Here’s a sane architecture for a take-home:

Data layer & modeling
You have JSONs; treat them like a small relational DB.

For a real app, you’d likely:

Load JSONs into a Postgres or SQLite DB (e.g. via Prisma).
Model main tables:
Election, BallotItem, Race, Measure
Office, OfficeTerm, Jurisdiction
Person, Profile, VoterVerification
InfluenceTarget, ViewpointGroup, join tables
For the take-home, you can:

Load JSONs server-side into memory at startup.
Precompute derived tables/aggregations:
supporters per jurisdiction
supporters per election
influence targets per viewpoint
Expose read-only APIs:

GET /api/summary – top-level metrics
GET /api/time-series – growth over time
GET /api/jurisdictions – comparative table
GET /api/elections – upcoming elections with influence scores
GET /api/elections/[id] – election detail view
TypeScript interfaces to keep things clear, e.g.:

 Download
 Copy
type JurisdictionInfluence = {
  jurisdictionId: string;
  name: string;
  supporterCount: number;
  estimatedTurnout: number | null;
  supporterShare: number | null;
  activeSupporterCount: number;
  activeRate: number;
  growth30d: number;
};
Next.js structure
Use the App Router:

app/
page.tsx – Overview
jurisdictions/page.tsx
elections/page.tsx
elections/[id]/page.tsx
api/summary/route.ts
api/jurisdictions/route.ts
etc.
On the frontend:

Use React Query or simple fetch hooks.
Use a chart library (e.g. Recharts, Nivo, or Chart.js) for:
time series line chart
bar chart for jurisdiction comparison
Use a table library or basic table components.
Where to calculate metrics
For this assignment, I’d:

Do the heavier joins & aggregations server-side (in the API routes).
Cache results in memory (simple module-level cache or in-memory store) since data is static.
Keep the frontend purely presentational + filtering/sorting.
6. A phased plan (3–4 hours realistic path)
If you were actually doing this in the allotted time:

Hour 0–1: Data + metrics

Load JSONs, build a small Node/TS script (or API) that:
connects persons → voter verifications → jurisdictions
computes supporters per jurisdiction
builds a basic time series of supporter counts.
Hour 1–2: API + basic pages

Create summary, jurisdictions, and time-series endpoints.
Build the Overview page:
summary cards
time series chart.
Hour 2–3: Comparative views + elections

Jurisdictions page with sortable table.
Basic Upcoming Elections view:
for now, show elections, supporter counts, simple scores.
Hour 3–4: Polish & insights

Add “High Leverage Opportunities” section.
Add explanatory copy below charts (“What this means / What to do”).
Clean up visuals; ensure types and data sanity.
If you want, I can next:

Sketch specific API route shapes (request/response) for one or two endpoints, or
Propose concrete React component structure for the Overview page (which cards, which props, which hooks).


