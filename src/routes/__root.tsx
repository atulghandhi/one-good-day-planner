import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";

const APP_DESCRIPTION =
  "A lightweight daily planner and brainstorm canvas for choosing what matters today, catching ideas, and keeping momentum without accounts or clutter.";
const SOCIAL_IMAGE = "/og-image.png";

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
        content: APP_DESCRIPTION,
      },
      { name: "author", content: "One Good Day" },
      { property: "og:site_name", content: "One Good Day" },
      { property: "og:title", content: "One Good Day" },
      {
        property: "og:description",
        content: APP_DESCRIPTION,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "One Good Day" },
      {
        name: "twitter:description",
        content: APP_DESCRIPTION,
      },
      { property: "og:image", content: SOCIAL_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "One Good Day planner and brainstorm canvas" },
      { name: "twitter:image", content: SOCIAL_IMAGE },
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
      <PageToggleShortcut />
      <Outlet />
    </>
  );
}

function PageToggleShortcut() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        const target = location.pathname.startsWith("/brainstorm") ? "/" : "/brainstorm";
        navigate({ to: target });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, location.pathname]);

  return null;
}

function LovableBadgeBlocker() {
  useEffect(() => {
    const isCloseOnlyControl = (element: HTMLElement) => {
      const label = [
        element.innerText,
        element.textContent,
        element.getAttribute("aria-label"),
        element.getAttribute("title"),
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
        .toLowerCase();

      if (!["x", "×", "close", "close dialog", "dismiss", "✕"].includes(label)) return false;

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const nearRight = window.innerWidth - rect.right < 96;
      const nearBottom = window.innerHeight - rect.bottom < 96;

      return (
        style.position === "fixed" &&
        nearRight &&
        nearBottom &&
        rect.width <= 96 &&
        rect.height <= 96
      );
    };

    const looksLikeLovableBadge = (element: Element) => {
      if (!(element instanceof HTMLElement)) return false;
      const text = element.innerText?.trim().toLowerCase() ?? "";
      const href = element instanceof HTMLAnchorElement ? element.href.toLowerCase() : "";
      const aria = element.getAttribute("aria-label")?.toLowerCase() ?? "";
      const title = element.getAttribute("title")?.toLowerCase() ?? "";
      const className = element.getAttribute("class")?.toLowerCase() ?? "";
      const id = element.id?.toLowerCase() ?? "";
      const testId = element.getAttribute("data-testid")?.toLowerCase() ?? "";
      const source = element instanceof HTMLIFrameElement ? element.src.toLowerCase() : "";

      return (
        text.includes("edit with lovable") ||
        aria.includes("edit with lovable") ||
        title.includes("edit with lovable") ||
        href.includes("lovable.dev") ||
        source.includes("lovable") ||
        className.includes("lovable") ||
        id.includes("lovable") ||
        testId.includes("lovable") ||
        isCloseOnlyControl(element)
      );
    };

    const removeLovableBadges = () => {
      document.querySelectorAll("a, button, iframe, div, aside").forEach((element) => {
        if (!looksLikeLovableBadge(element)) return;
        const host =
          element.closest('[id*="lovable" i], [class*="lovable" i], [data-testid*="lovable" i]') ??
          element.closest("div") ??
          element;
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
