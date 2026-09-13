import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { guides } from "@/content/guides";
import { jsonLd, seoHead, SITE_URL } from "@/lib/seo";
export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const guide = guides.find((item) => item.slug === params.slug);
    if (!guide) throw notFound();
    return guide;
  },
  head: ({ loaderData: guide }) =>
    guide
      ? {
          ...seoHead({
            title: `${guide.title} | One Good Day`,
            description: guide.description,
            path: `/guides/${guide.slug}`,
            type: "article",
          }),
          scripts: [
            jsonLd({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: guide.title,
              description: guide.description,
              author: { "@type": "Organization", name: "One Good Day", url: SITE_URL },
              mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
            }),
            jsonLd({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Planner", item: `${SITE_URL}/` },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Planning guides",
                  item: `${SITE_URL}/guides`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: guide.title,
                  item: `${SITE_URL}/guides/${guide.slug}`,
                },
              ],
            }),
          ],
        }
      : {},
  component: Guide,
});
function Guide() {
  const guide = Route.useLoaderData();
  return (
    <article>
      <p className="t-eyebrow text-muted-foreground">By One Good Day</p>
      <h1 className="mt-4 t-display">{guide.title}</h1>
      <p className="mt-5 t-body-lg text-muted-foreground">{guide.intro}</p>
      {guide.sections.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="t-display-sm">{section.title}</h2>
          <p className="mt-3 t-body leading-relaxed">{section.text}</p>
        </section>
      ))}
      <aside className="mt-10 rounded-[2rem] border border-border bg-card/80 p-7 shadow-soft">
        <h2 className="t-display-sm">Try it today</h2>
        <p className="mt-3 t-body">{guide.takeaway}</p>
        <Link
          to={guide.target}
          className="mt-5 inline-flex rounded-full bg-gradient-mit px-5 py-3 font-semibold text-[color:var(--mit-foreground)]"
        >
          {guide.action} →
        </Link>
      </aside>
      <nav aria-label="Related planning guides" className="mt-10">
        <h2 className="t-display-sm">Keep exploring</h2>
        <ul className="mt-4 space-y-3">
          {guides
            .filter((item) => item.slug !== guide.slug)
            .map((item) => (
              <li key={item.slug}>
                <Link
                  to="/guides/$slug"
                  params={{ slug: item.slug }}
                  className="underline underline-offset-4"
                >
                  {item.title}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </article>
  );
}
