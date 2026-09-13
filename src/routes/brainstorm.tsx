import { createFileRoute, Link } from "@tanstack/react-router";
import { Brainstorm } from "@/components/Brainstorm";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/brainstorm")({
  head: () =>
    seoHead({
      title: "Free Online Brainstorm Canvas | One Good Day",
      description:
        "Map ideas on a free online brainstorm canvas, connect smaller steps, and send ideas to your daily planner. No sign-up. Boards saved in your browser.",
      path: "/brainstorm",
    }),
  component: () => (
    <>
      <Brainstorm />
      <section className="relative mx-auto max-w-2xl px-5 py-10">
        <h1 className="t-display-sm">Free online brainstorm canvas</h1>
        <p className="mt-3 t-body text-muted-foreground">
          Capture ideas around a central question, add child ideas, and turn a selected idea into a
          task in your daily planner. Boards save in this browser without an account. Share links
          contain a snapshot, so anyone with the link can read that snapshot.
        </p>
        <Link
          to="/guides/$slug"
          params={{ slug: "brainstorm-to-action-plan" }}
          className="mt-4 inline-block underline"
        >
          How to turn a brainstorm into an action plan →
        </Link>
      </section>
    </>
  ),
});
