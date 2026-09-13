import { createFileRoute, Link } from "@tanstack/react-router";
import { guides } from "@/content/guides";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/guides/")({
  head: () =>
    seoHead({
      title: "Simple Daily Planning Guides | One Good Day",
      description:
        "Practical guides to planning your day, choosing your most important task, and turning brainstormed ideas into actions. Free examples from One Good Day.",
      path: "/guides",
    }),
  component: Guides,
});
function Guides() {
  return (
    <>
      <p className="t-eyebrow text-muted-foreground">A little help getting started</p>
      <h1 className="mt-4 t-display">Simple daily planning guides</h1>
      <p className="mt-5 t-body text-muted-foreground">
        Choose a manageable day, find your first step, and give good ideas somewhere to go. These
        guides use the same One Thing, Shoulds, and Coulds approach as the planner.
      </p>
      <div className="mt-8 space-y-6">
        {guides.map((guide) => (
          <article
            key={guide.slug}
            className="rounded-[2rem] border border-border bg-card/80 p-7 shadow-soft"
          >
            <h2 className="t-display-sm">
              <Link to="/guides/$slug" params={{ slug: guide.slug }} className="hover:underline">
                {guide.title}
              </Link>
            </h2>
            <p className="mt-3 t-body text-muted-foreground">{guide.description}</p>
          </article>
        ))}
      </div>
    </>
  );
}
