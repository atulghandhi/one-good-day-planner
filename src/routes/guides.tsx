import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/guides")({ component: GuideLayout });
function GuideLayout() {
  return (
    <main className="relative mx-auto w-full max-w-2xl px-5 py-10 md:py-14">
      <nav aria-label="Main navigation" className="mb-10 flex flex-wrap gap-5 t-meta">
        <Link to="/">One Good Day · Planner</Link>
        <Link to="/brainstorm">Brainstorm</Link>
        <Link to="/guides">Planning guides</Link>
      </nav>
      <Outlet />
      <footer className="mt-12 border-t border-border pt-6 t-meta text-muted-foreground">
        <Link to="/">Free daily planner</Link>
        <span className="mx-3">·</span>
        <Link to="/diary">About the design</Link>
      </footer>
    </main>
  );
}
