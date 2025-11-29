import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <header className="mb-12">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Leader Influence Dashboard Take-Home Project
            </h1>
          </header>

          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              Anatomy of a Sway Engineer
            </h2>
            <aside className="my-6 rounded-lg border-l-4 border-primary bg-muted/50 p-4">
              <blockquote className="m-0 text-muted-foreground">
                <p className="font-medium">
                  <strong>
                    Our mission is to build a class defining, delightful,
                    simple, and performant Sway experience.
                  </strong>
                </p>
              </blockquote>
            </aside>
            <p className="text-muted-foreground">
              Here are the key attributes we value in our team members:
            </p>
            <ul className="my-4 space-y-2 text-muted-foreground">
              <li>• Independent, creative thinking</li>
              <li>• Mutual respect and support</li>
              <li>• Commitment to craftsmanship</li>
              <li>• Setting high standards together</li>
              <li>• Willingness to tackle any task, regardless of scope</li>
              <li>• Clear thinking and decisiveness</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              Assessment Goals
            </h2>
            <p className="mb-4 text-muted-foreground">
              Traditional engineering interviews typically involve multiple
              rounds spread across several days, focusing on different technical
              aspects through question-and-answer formats. While this approach
              may work for large-scale hiring (though that&apos;s debatable), we
              don&apos;t believe it suits our small startup environment.
            </p>
            <p className="mb-4 text-muted-foreground">
              Instead, we will first invite you to work remotely on a small,
              standalone project that you&apos;ll drive to completion. From
              there, if we find that this is a good fit, we will invite you for
              a longer, fully compensated and in-person assessment. This
              approach gives everyone a chance to experience real-world
              dynamics—from communication styles to work pace to decision-making
              preferences—in an authentic day-in-the-life setting.
            </p>
            <aside className="my-6 rounded-lg border-l-4 border-primary bg-muted/50 p-4">
              <blockquote className="m-0 text-muted-foreground">
                <p>
                  Joining a startup isn&apos;t just about finding a
                  job—it&apos;s about finding a group of people you&apos;d trust
                  to go bungee jumping with. We hope this process helps you
                  decide if we&apos;re your crew!
                </p>
              </blockquote>
            </aside>
          </section>

          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              Expected Effort
            </h2>
            <ul className="my-4 space-y-2 text-muted-foreground">
              <li>
                • Set aside about 4 hours (does not have to be contiguous) to
                finish this project remotely
              </li>
              <li>
                • Synchronous meeting (~30-45 minutes) with the team at the end
                of the trial to present your work
              </li>
            </ul>
          </section>

          <hr className="my-12 border-border" />

          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              Project Details
            </h2>
            <p className="mb-6 text-muted-foreground">
              Leaders on Sway are building political influence by mobilizing
              supporters, shaping discourse on issues, and demonstrating
              credible voting power to elected officials. Today, they lack
              visibility into how their movements are growing and which elected
              officials they have power over.
            </p>

            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Your Task
              </h3>
              <p className="mb-4 text-muted-foreground">
                You&apos;ll design and prototype a{" "}
                <strong className="text-foreground">
                  &quot;Leader Influence Dashboard&quot;
                </strong>{" "}
                that turns raw political support data into{" "}
                <strong className="text-foreground">
                  insightful, actionable intelligence
                </strong>
                . Design and build a dashboard that helps a leader understand
                their political influence and discover where to grow it next.
                Think of this as a blend of data storytelling and strategy —
                part analytics tool, part growth compass.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Part 1: Product Brief (20 mins)
              </h3>
              <p className="mb-4 text-muted-foreground">
                Write a short 1-page brief covering:
              </p>
              <ol className="my-4 ml-6 list-decimal space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground">
                    What does &quot;influence&quot; mean on Sway?
                  </strong>
                  <br />
                  <span className="text-sm">
                    Consider social visibility, supporter engagement, geographic
                    reach, and real-world electoral leverage. How might a
                    leader&apos;s <em>network of supporters</em> translate into{" "}
                    <em>political power</em>?
                  </span>
                </li>
                <li>
                  <strong className="text-foreground">
                    Which 3–5 metrics matter most?
                  </strong>
                  <br />
                  <span className="text-sm">
                    Define measurable indicators of influence.
                  </span>
                </li>
                <li>
                  <strong className="text-foreground">
                    What insights and actions should the dashboard enable?
                  </strong>
                </li>
                <li>
                  <strong className="text-foreground">
                    What&apos;s out of scope (and why)?
                  </strong>
                </li>
              </ol>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Part 2: Build the Dashboard (3-4 hours)
              </h3>
              <p className="mb-4 text-muted-foreground">
                You&apos;ll design and prototype the dashboard using the{" "}
                <strong className="text-foreground">mock dataset</strong>{" "}
                provided. Your goal is not to make it pixel-perfect, but to make
                it an{" "}
                <strong className="text-foreground">
                  insightful and believable example
                </strong>{" "}
                of what this sample leader might want to see.
              </p>
              <div className="my-6 rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-3 font-semibold text-foreground">
                  Requirements:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    Display meaningful metrics about a leader&apos;s influence
                  </li>
                  <li>
                    Show how metrics have changed over time (we&apos;ve provided
                    real, anonymized data)
                  </li>
                  <li>
                    Include at least one comparative or contextual metric (i.e.
                    a metric that varies by location or election)
                  </li>
                  <li>
                    The dashboard should guide the leader toward actionable
                    insights
                  </li>
                  <li>
                    Our only stack requirements: use Typescript &amp; Next.js
                    for the frontend. All else is flexible!
                  </li>
                  <li>
                    We also encourage you to utilize any and all AI tools at
                    your disposal.
                  </li>
                </ul>
              </div>
              <p className="mb-3 font-semibold text-foreground">You decide:</p>
              <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                <li>Which metrics to calculate and how</li>
                <li>How to visualize trends and comparisons</li>
                <li>What makes an insight &quot;actionable&quot;</li>
                <li>How to store, model, and query the underlying data</li>
                <li>
                  Any additional features that make your dashboard compelling
                </li>
              </ul>
              <aside className="my-6 rounded-lg border-l-4 border-primary bg-muted/50 p-4">
                <p className="mb-2 font-semibold text-foreground">
                  💡 Mock Data
                </p>
                <p className="mb-2 text-sm text-muted-foreground">
                  The data can be found in{" "}
                  <a
                    href="https://drive.google.com/drive/folders/1QoDx-dLCqzIzXBhs9SlupumzKH5V47-W?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline hover:text-primary/80"
                  >
                    this Google Drive
                  </a>{" "}
                  and is real, anonymized data from Sway users. See the appendix
                  below for more details.
                </p>
                <p className="text-sm text-muted-foreground">
                  We also provide access to our{" "}
                  <a
                    href="https://www.sway.co/docs/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline hover:text-primary/80"
                  >
                    own Sway API
                  </a>{" "}
                  (SwayPI, as some have said). Exploring this is optional, but
                  can be used as a resource to augment the mock data.
                </p>
              </aside>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Part 3: Future Evolution (10 min, in README)
              </h3>
              <p className="mb-4 text-muted-foreground">
                Finally, briefly document your strategic and technical thinking:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                <li>What shortcuts or simplifications did you make?</li>
                <li>What assumptions were necessary for this prototype?</li>
                <li>
                  What would break or need redesign at{" "}
                  <strong className="text-foreground">100k supporters</strong>{" "}
                  or <strong className="text-foreground">100k leaders</strong>?
                </li>
                <li>
                  What new capabilities would you add at scale (perhaps with
                  information from other leaders)?
                </li>
                <li>What would you build next — and why?</li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                This section helps us understand how you think about{" "}
                <strong className="text-foreground">
                  scaling influence analytics
                </strong>{" "}
                from MVP to product ecosystem.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Evaluation Criteria
              </h3>
              <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Product thinking:</strong>{" "}
                  Did you identify meaningful metrics?
                </li>
                <li>
                  <strong className="text-foreground">Code quality:</strong> Is
                  it maintainable and well-structured?
                </li>
                <li>
                  <strong className="text-foreground">Data modeling:</strong>{" "}
                  Can this scale and extend?
                </li>
                <li>
                  <strong className="text-foreground">Design:</strong> Is it
                  intuitive and actionable?
                </li>
                <li>
                  <strong className="text-foreground">
                    Technical decisions:
                  </strong>{" "}
                  Are tradeoffs documented?
                </li>
              </ul>
            </div>
          </section>

          <hr className="my-12 border-border" />

          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              Appendix: Guide to the Sample Data
            </h2>

            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                What Data Is Included
              </h3>
              <p className="mb-4 text-muted-foreground">
                This dataset represents one leader&apos;s group and all the
                information relevant to their supporters. Think of it as a
                snapshot of a political movement and the elections happening in
                the communities where their supporters live.
              </p>

              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  Background Details
                </h4>
                <p className="mb-3 text-sm text-muted-foreground">
                  A leader&apos;s group is specified by the{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    viewpoint_groups
                  </code>{" "}
                  table:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    One leader has created a political viewpoint group (like a
                    coalition or political movement). The main group for this
                    take home is the one with id{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      4d627244-5598-4403-8704-979140ae9cac
                    </code>
                    .
                  </li>
                  <li>
                    Multiple people have joined as supporters/followers of this
                    group
                  </li>
                  <li>
                    If any of those supporters became leaders themselves and
                    created their own viewpoints, we include their groups too
                    (showing the &quot;network effect&quot; of the movement)
                  </li>
                </ul>
                <p className="mt-3 text-sm text-muted-foreground">
                  <strong className="text-foreground">
                    Complete Ballot Information:
                  </strong>
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    For each jurisdiction where supporters live, we include
                    EVERY ballot item they&apos;ll see in upcoming elections
                  </li>
                  <li>
                    This includes:
                    <ul className="ml-6 mt-2 list-disc space-y-1">
                      <li>
                        <strong className="text-foreground">Races:</strong>{" "}
                        Elections for offices (Mayor, City Council, Congress,
                        etc.) with all candidates running
                      </li>
                      <li>
                        <strong className="text-foreground">Measures:</strong>{" "}
                        Ballot propositions/initiatives that voters will decide
                        on
                      </li>
                    </ul>
                  </li>
                  <li>
                    Real candidate names are included (public record data)
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  Core Group Data
                </h4>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      viewpoint_groups.json
                    </code>{" "}
                    - The political coalition(s) - includes the main group and
                    any groups created by supporters who became leaders
                    themselves.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      slugs.json
                    </code>{" "}
                    - URL-friendly identifiers for viewpoint groups (e.g.,
                    &quot;seattle-progressives-2024&quot;).
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  People &amp; Relationships
                </h4>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      profiles.json
                    </code>{" "}
                    - Public-facing user profiles - ANONYMIZED names and bios.
                    Think of these as the social media persona.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      persons.json
                    </code>{" "}
                    - Person entities - supporters are ANONYMIZED, but candidate
                    names are REAL (public records).
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      profile_viewpoint_group_rels.json
                    </code>{" "}
                    - Who&apos;s in which group - links profiles to viewpoint
                    groups with their role (leader, supporter, etc.).
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      profile_viewpoint_group_rel_types.json
                    </code>{" "}
                    - Lookup table for relationship types: leader, supporter,
                    administrator, bookmarker, default.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  Voter Registration
                </h4>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      voter_verifications.json
                    </code>{" "}
                    - Verified voter registration records - ANONYMIZED names,
                    location data excluded for privacy.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      id_verifications.json
                    </code>{" "}
                    - ID verification records used to confirm voter registration
                    - ANONYMIZED, encrypted data excluded.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      jurisdictions.json
                    </code>{" "}
                    - Geographic/political boundaries where voters are
                    registered (counties, cities, congressional districts,
                    etc.).
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      voter_verification_jurisdiction_rels.json
                    </code>{" "}
                    - Links voter registrations to their specific jurisdictions.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  Political Targeting
                </h4>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      influence_targets.json
                    </code>{" "}
                    - Abstract &quot;things to influence&quot; - could be
                    offices or measures. These exist in specific jurisdictions.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      influence_target_viewpoint_group_rels.json
                    </code>{" "}
                    - Priority weights showing which targets matter most to each
                    group (e.g., 50%, 30%, 20%).
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  Elections &amp; Ballots
                </h4>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      elections.json
                    </code>{" "}
                    - Election dates and metadata (e.g., &quot;November 2024
                    General Election&quot;).
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      ballot_items.json
                    </code>{" "}
                    - Items appearing on ballots in specific jurisdictions - can
                    be races or measures.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      ballot_item_options.json
                    </code>{" "}
                    - The actual choices voters can select (candidate names,
                    Yes/No options, etc.).
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  Races (Office Elections)
                </h4>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      offices.json
                    </code>{" "}
                    - Political offices up for election (Mayor, City Council,
                    Congress, etc.) with details about the position.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      office_terms.json
                    </code>{" "}
                    - Specific terms being filled (e.g., &quot;2025-2029 Seattle
                    Mayor term&quot;).
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      races.json
                    </code>{" "}
                    - The actual election contests for offices.
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      candidacies.json
                    </code>{" "}
                    - Candidates running for office - NOT ANONYMIZED (public
                    record data).
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      parties.json
                    </code>{" "}
                    - Political party information (Democrat, Republican,
                    Independent, etc.).
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  Measures (Propositions)
                </h4>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      measures.json
                    </code>{" "}
                    - Ballot propositions/initiatives with full text, summaries,
                    and fiscal impact statements.
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                File Relationships Quick Reference
              </h3>
              <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                <li>
                  To find who&apos;s in the group:{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    profile_viewpoint_group_rels
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    profiles
                  </code>
                </li>
                <li>
                  To find where supporters vote:{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    profiles
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    persons
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    voter_verifications
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    voter_verification_jurisdiction_rels
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    jurisdictions
                  </code>
                </li>
                <li>
                  To find what&apos;s on their ballot:{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    jurisdictions
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    ballot_items
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    races
                  </code>{" "}
                  or{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    measures
                  </code>
                </li>
                <li>
                  To find candidates:{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    ballot_items
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    ballot_item_options
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    candidacies
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    persons
                  </code>{" "}
                  (real names)
                </li>
                <li>
                  To find leader priorities:{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    viewpoint_groups
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    influence_target_viewpoint_group_rels
                  </code>{" "}
                  →{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                    influence_targets
                  </code>
                </li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Data Structure: Influence Targets, Offices, and Measures
              </h3>
              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  The Big Picture
                </h4>
                <p className="mb-3 text-sm text-muted-foreground">
                  Influence Target is an umbrella concept. It represents
                  &quot;something people can vote on.&quot; That
                  &quot;something&quot; can be one of two types:
                </p>
                <ol className="ml-6 list-decimal space-y-2 text-sm text-muted-foreground">
                  <li>
                    An Office - A political position (like &quot;Mayor of
                    Seattle&quot; or &quot;U.S. Senator&quot;)
                  </li>
                  <li>
                    A Measure - A ballot proposition/initiative (like
                    &quot;Should we raise the minimum wage?&quot;)
                  </li>
                </ol>
              </div>
              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  The Hierarchy
                </h4>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs font-mono text-muted-foreground">
                  {`influence_target (the abstract concept of "something to influence")
├─→ office (a political position)
│     ↓
│     └─→ office_term (a specific instance of that office being filled)
│           ↓
│           └─→ race (the actual election contest on a ballot)
│                 ↓
│                 └─→ ballot_item (what voters see)
│
└─→ measure (a ballot proposition)
           ↓
           └─→ ballot_item (what voters see)`}
                </pre>
              </div>
              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  How It Works in Practice
                </h4>
                <div className="mb-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">
                    Example 1: An Office
                  </p>
                  <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                    <li>
                      Influence Target: &quot;Seattle City Council Position
                      9&quot; in King County
                    </li>
                    <li>
                      Office: City Council Position 9 (with details about term
                      length, salary, etc.)
                    </li>
                    <li>
                      Office Term: The 2025-2029 term that needs to be filled
                    </li>
                    <li>
                      Race: The actual 2025 election contest for this seat
                    </li>
                    <li>
                      Ballot Item: What appears on Seattle voters&apos; ballots
                      in November 2025
                    </li>
                  </ul>
                </div>
                <div className="mb-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">
                    Example 2: A Measure
                  </p>
                  <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                    <li>
                      Influence Target: &quot;Initiative 2024-01: Minimum Wage
                      Increase&quot; in King County
                    </li>
                    <li>
                      Measure: The proposition text, title, fiscal impact, etc.
                    </li>
                    <li>
                      Ballot Item: What appears on King County voters&apos;
                      ballots
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  Key Relationships:
                </h4>
                <ol className="ml-6 list-decimal space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong className="text-foreground">
                      Leader Priorities:
                    </strong>
                    <br />
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      viewpoint_group
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      influence_target_viewpoint_group_rels
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      influence_target
                    </code>
                    <br />
                    <span className="text-xs italic">
                      Note that this dataset is empty at the moment. Focus on
                      voter influence_target connections.
                    </span>
                  </li>
                  <li>
                    <strong className="text-foreground">Office Path:</strong>
                    <br />
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      influence_target
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      office
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      office_term
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      race
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      ballot_item
                    </code>
                  </li>
                  <li>
                    <strong className="text-foreground">Measure Path:</strong>
                    <br />
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      influence_target
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      measure
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      ballot_item
                    </code>
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Voter Connection:
                    </strong>
                    <br />
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      person
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      voter_verifications
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      voter_verification_jurisdiction_rels
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      jurisdiction
                    </code>{" "}
                    →{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      ballot_item
                    </code>{" "}
                    (contains both races and measures)
                  </li>
                </ol>
              </div>
              <div className="mb-6">
                <h4 className="mb-3 font-semibold text-foreground">
                  In the Data
                </h4>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      influence_targets
                    </code>{" "}
                    table:
                    <ul className="ml-6 mt-2 list-disc space-y-1">
                      <li>
                        Has{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          jurisdiction_id
                        </code>{" "}
                        (where this target exists)
                      </li>
                      <li>
                        Doesn&apos;t specify if it&apos;s an office or measure
                        directly
                      </li>
                    </ul>
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      offices
                    </code>{" "}
                    table:
                    <ul className="ml-6 mt-2 list-disc space-y-1">
                      <li>
                        Has{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          influence_target_id
                        </code>{" "}
                        pointing back to the influence target
                      </li>
                      <li>
                        Contains office details (name, level:
                        federal/state/local, district info)
                      </li>
                    </ul>
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      measures
                    </code>{" "}
                    table:
                    <ul className="ml-6 mt-2 list-disc space-y-1">
                      <li>
                        Has{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          influence_target_id
                        </code>{" "}
                        pointing back to the influence target
                      </li>
                      <li>
                        Contains measure text, summary, fiscal impact, etc.
                      </li>
                    </ul>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">
                  <strong className="text-foreground">
                    Why the indirection?
                  </strong>{" "}
                  This allows:
                </p>
                <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                  <li>
                    Leaders to prioritize &quot;things to influence&quot;
                    without caring whether they&apos;re offices or measures
                  </li>
                  <li>
                    Cleaner data model where both types inherit jurisdiction and
                    other common properties
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <div className="mt-12 flex justify-center">
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View Dashboard →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
