import { createFileRoute } from "@tanstack/react-router";
import { Planner } from "@/components/Planner";

const URL = "https://just-one-good-day.lovable.app/";
const TITLE = "One Good Day — a delightfully simple daily planner";
const DESCRIPTION =
  "Plan one great day at a time. Pick your most important task, a few shoulds, a few coulds. No accounts, no clutter.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "One Good Day",
          url: URL,
          description: DESCRIPTION,
          applicationCategory: "ProductivityApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <Planner />;
}
