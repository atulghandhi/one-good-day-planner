import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// With SEO_BASE_URL, exercise the deployed HTTP responses; otherwise test the production SSR build.
const base = process.env.SEO_BASE_URL;
const server = base ? null : (await import("../dist/server/server.js")).default;
const request = (path) =>
  base ? fetch(`${base}${path}`) : server.fetch(new Request(`https://www.onegoodday.work${path}`));
const canonicalOrigin = "https://www.onegoodday.work";
const publicPaths = [
  "/",
  "/brainstorm",
  "/diary",
  "/guides",
  "/guides/how-to-plan-your-day",
  "/guides/most-important-task-method",
  "/guides/brainstorm-to-action-plan",
];
const titles = new Set();
for (const path of [...publicPaths, "/reflect", "/receive"]) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert.ok(title, `Missing title: ${path}`);
  assert.ok(!titles.has(title), `Duplicate title: ${path}`);
  titles.add(title);
  const canonicals = html.match(/<link\b[^>]*rel="canonical"[^>]*>/g) ?? [];
  assert.equal(canonicals.length, 1, `Canonical count: ${path}`);
  assert.ok(canonicals[0].includes(`href="${canonicalOrigin}${path}"`), `Canonical URL: ${path}`);
  assert.equal(
    (html.match(/<meta name="description"/g) ?? []).length,
    1,
    `Description count: ${path}`,
  );
  assert.ok(html.includes("https://www.onegoodday.work/og-image.png"), `Social image: ${path}`);
  assert.ok(
    html.includes(
      publicPaths.includes(path) ? "index, follow, max-image-preview:large" : "noindex, follow",
    ),
    `Robots: ${path}`,
  );
  if (path.startsWith("/guides/"))
    assert.ok(html.includes("Try it today"), `Missing SSR guide content: ${path}`);
  for (const match of html.matchAll(
    /<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs,
  ))
    JSON.parse(match[1]);
  console.log(`PASS ${path}`);
}
for (const path of ["/not-a-real-page", "/guides/not-a-real-guide"]) {
  assert.equal((await request(path)).status, 404, `404 status: ${path}`);
  console.log(`PASS ${path} returns 404`);
}
const sitemapResponse = await request("/sitemap.xml");
assert.equal(sitemapResponse.status, 200);
assert.match(sitemapResponse.headers.get("content-type"), /application\/xml/);
const sitemap = await sitemapResponse.text();
for (const path of publicPaths) assert.ok(sitemap.includes(`<loc>${canonicalOrigin}${path}</loc>`));
assert.ok(!sitemap.includes("/reflect") && !sitemap.includes("/receive"));
const robots = base
  ? await (await request("/robots.txt")).text()
  : await readFile("dist/client/robots.txt", "utf8");
assert.ok(robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`));
console.log("PASS sitemap and robots.txt");
