# Search visibility for One Good Day

Canonical origin: https://www.onegoodday.work (the apex currently redirects here).

## Search intent and pages

| Page                               | Intent                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| /                                  | Free online daily planner, no sign-up, minimalist daily planner |
| /brainstorm                        | Free online brainstorm canvas, ideas to tasks                   |
| /guides/how-to-plan-your-day       | How to plan your day, worked daily plan                         |
| /guides/most-important-task-method | Most important task method, choosing a priority                 |
| /guides/brainstorm-to-action-plan  | Turn brainstorm ideas into an action plan                       |

These are qualitative targets based on product fit and search-result inspection, not measured keyword volumes or current rankings. Avoid targeting calendar syncing, live team collaboration, or printable templates: the app does not offer those features.

## Verification

Run `npm run build`, `npm test`, `npx tsc --noEmit`, and `node scripts/check-seo.mjs`.
Run `SEO_BASE_URL=https://www.onegoodday.work node scripts/check-seo.mjs` after deployment.
The SEO check exercises production HTML, unique titles, canonical URLs, descriptions, robots directives, parseable structured data, guide content without JavaScript, the sitemap, and real 404 responses.

## After deployment

1. Verify the domain in Google Search Console, then submit https://www.onegoodday.work/sitemap.xml. Use URL Inspection on the homepage and guides to confirm Google's selected canonical and rendered content. DNS verification needs the domain owner's account.
2. Record impressions, clicks, click-through rate, and average position by query and page. Start with a 28-day baseline; allow for crawl/indexing delays. Use these results to choose the next content improvement, rather than publishing near-duplicate keyword pages.
3. Check mobile Core Web Vitals in Search Console when field data is available. Build success is not a Core Web Vitals measurement.
4. The apex-to-www redirect is currently 307 in Vercel's domain configuration. Set it to a permanent 308 redirect when managing those domain settings. Canonical tags and the sitemap already use www consistently.
5. Seek relevant, editorial mentions from people who actually use the planner. Do not buy links or invent testimonials, ratings, or usage counts.

The reflections and receive routes use noindex. They are crawlable so search engines can read that directive; noindex is not a security control. Saved personal content remains browser-local. Shared URL fragments are not included in canonicals or the sitemap.

Sources: Google Search Central's JavaScript SEO basics (https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), developer guide (https://developers.google.com/search/docs/fundamentals/get-started-developers), and people-first content guidance (https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
