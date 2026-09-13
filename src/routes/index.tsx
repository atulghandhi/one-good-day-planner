import { createFileRoute } from "@tanstack/react-router";
import { Planner } from "@/components/Planner";
import { jsonLd, seoHead, SITE_URL } from "@/lib/seo";
export const Route = createFileRoute("/")({
  head: () => ({
    ...seoHead({
      title: "Free Daily Planner, No Sign-Up | One Good Day",
      description:
        "A free online daily planner with no sign-up. Choose your most important task, organise shoulds and coulds, and start a focus timer. Saved in your browser.",
      path: "/",
    }),
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "One Good Day",
        url: `${SITE_URL}/`,
      }),
      jsonLd({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "One Good Day",
        url: `${SITE_URL}/`,
        applicationCategory: "ProductivityApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and a modern web browser",
        description:
          "A free daily priority planner and brainstorm canvas. No account required. Plans are saved in your browser.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: [
          "Daily priority planning",
          "Task substeps",
          "Focus timer",
          "Brainstorm canvas",
          "Daily reflections",
        ],
      }),
    ],
  }),
  component: Planner,
});
