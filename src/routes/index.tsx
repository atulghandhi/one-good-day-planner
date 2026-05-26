import { createFileRoute } from "@tanstack/react-router";
import { Planner } from "@/components/Planner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "One Good Day — a delightfully simple daily planner" },
      {
        name: "description",
        content:
          "Plan one great day at a time. Pick your most important task, a few shoulds, a few coulds. No accounts, no clutter.",
      },
      { property: "og:title", content: "One Good Day" },
      {
        property: "og:description",
        content: "A delightfully simple daily planner. One day at a time.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <Planner />;
}
