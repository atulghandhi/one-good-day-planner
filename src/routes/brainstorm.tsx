import { createFileRoute } from "@tanstack/react-router";
import { Brainstorm } from "@/components/Brainstorm";

export const Route = createFileRoute("/brainstorm")({
  head: () => ({
    meta: [
      { title: "Brainstorm — One Good Day" },
      { name: "description", content: "Free-form idea brainstorming canvas." },
      { property: "og:title", content: "Brainstorm — One Good Day" },
      { property: "og:description", content: "Capture ideas around a central thought." },
    ],
  }),
  component: Brainstorm,
});
