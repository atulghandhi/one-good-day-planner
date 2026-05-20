import { createFileRoute } from "@tanstack/react-router";
import { Brainstorm } from "@/components/Brainstorm";

const URL = "https://just-one-good-day.lovable.app/brainstorm";
const TITLE = "Brainstorm — One Good Day";
const DESCRIPTION =
  "A free-form brainstorming canvas. Capture and connect ideas around a central thought, then promote the best one to your day.";

export const Route = createFileRoute("/brainstorm")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: Brainstorm,
});
