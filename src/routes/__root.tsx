import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "One Good Day" },
      {
        name: "description",
        content:
          "One Good Day - lightweight daily planning app with 'most important task', 'shoulds' and 'coulds'. Daily planner for ADHD or increased productivity.",
      },
      { name: "author", content: "One Good Day" },
      { property: "og:title", content: "One Good Day" },
      {
        property: "og:description",
        content:
          "One Good Day - lightweight daily planning app with 'most important task', 'shoulds' and 'coulds'. Daily planner for ADHD or increased productivity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "One Good Day" },
      {
        name: "twitter:description",
        content:
          "One Good Day - lightweight daily planning app with 'most important task', 'shoulds' and 'coulds'. Daily planner for ADHD or increased productivity.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6a970a7c-e24a-4730-855f-66d78997ef2a/id-preview-4495c1b8--a71304b9-30e3-438d-a99c-7d32d9297f2c.lovable.app-1776685159283.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6a970a7c-e24a-4730-855f-66d78997ef2a/id-preview-4495c1b8--a71304b9-30e3-438d-a99c-7d32d9297f2c.lovable.app-1776685159283.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <LovableBadgeBlocker />
      <Outlet />
    </>
  );
}

function LovableBadgeBlocker() {
  useEffect(() => {
    const looksLikeLovableBadge = (element: Element) => {
      if (!(element instanceof HTMLElement)) return false;
      const text = element.innerText?.trim().toLowerCase() ?? "";
      const href = element instanceof HTMLAnchorElement ? element.href.toLowerCase() : "";
      const aria = element.getAttribute("aria-label")?.toLowerCase() ?? "";
      return (
        text.includes("edit with lovable") ||
        aria.includes("edit with lovable") ||
        href.includes("lovable.dev")
      );
    };

    const removeLovableBadges = () => {
      document.querySelectorAll("a, button, iframe, div").forEach((element) => {
        if (!looksLikeLovableBadge(element)) return;
        const host = element.closest("div") ?? element;
        host.remove();
      });
    };

    removeLovableBadges();
    const observer = new MutationObserver(removeLovableBadges);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
