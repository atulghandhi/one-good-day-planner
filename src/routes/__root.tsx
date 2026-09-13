import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";

const APP_DESCRIPTION =
  "A lightweight daily planner and brainstorm canvas for choosing what matters today, catching ideas, and keeping momentum without accounts or clutter.";
const SOCIAL_IMAGE = "https://www.onegoodday.work/og-image.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="t-eyebrow text-muted-foreground">Not here.</p>
        <h1 className="mt-4 t-display">A quiet page.</h1>
        <p className="mt-3 t-body text-muted-foreground">
          Whatever you were looking for isn't on this path. That's okay.
        </p>
        <div className="mt-7">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-mit px-5 py-2.5 t-body-lg font-semibold text-[color:var(--mit-foreground)] shadow-pop transition hover:scale-[1.02]"
          >
            Back to today
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
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
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
      <OfflineIndicator />
      <ThemeColorMeta />
      <Outlet />
    </>
  );
}

function OfflineIndicator() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (online) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] rounded-full border border-white/40 bg-card/80 px-3 py-1.5 t-meta text-muted-foreground shadow-soft backdrop-blur">
      You're offline. Saved here for you.
    </div>
  );
}

function ThemeColorMeta() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => {
      const card = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim();
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      if (card) meta.content = card;
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "data-theme", "class"],
    });
    return () => observer.disconnect();
  }, []);
  return null;
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
