import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/diary")({
  component: DiaryPage,
});

type Entry = {
  date: string;
  title: string;
  body: string[];
};

const ENTRIES: Entry[] = [
  {
    date: "2026-05-22",
    title: "Why we don't have streaks.",
    body: [
      "The moment a planner shows you a streak, it stops being a planner and starts being a punishment.",
      "Streaks turn a single missed day into evidence — proof you broke something. The brain then does what brains do under threat: it avoids. And avoidance is the exact friction One Good Day exists to remove.",
      "We track nothing across days that you don't ask to see. Reflections you write are saved. Days you mark done are saved. But there is no count, no rank, no row of green dots judging the week. The page on Monday looks the same as the page on Friday: a clean field where you choose what matters today.",
    ],
  },
  {
    date: "2026-05-22",
    title: "Why the gradient drifts at 42 seconds.",
    body: [
      "A still gradient is a still planner. A fast-moving gradient is anxious. We wanted the screen to feel like sitting beside a quiet body of water — present, alive, but not asking anything of you.",
      "Forty-two seconds is long enough that you don't notice the motion unless you look for it, and short enough that the colour shift across a working session is meaningful. We tested 18s (distracting), 30s (still slightly busy), 60s (felt static). 42 was the answer.",
      "Reduce motion users see the gradient at rest. The atmosphere is calm either way.",
    ],
  },
  {
    date: "2026-05-22",
    title: "Why the One Thing has no formatting toolbar anymore.",
    body: [
      "Originally the One Thing input had bold, italic, lists, blockquotes, code, code blocks. Six buttons hovering beneath a question — *What would make today a win?*",
      "Six buttons of formatting tell you something subtly: this is a place to build a document. To structure thinking. To produce.",
      "But the One Thing is a sentence. A clear single sentence. The toolbar invited bullet lists, which invited sub-bullet lists, which is exactly what the rest of the app is for. We took it out. Bold remains, on Cmd/Ctrl+B, because emphasis on a clause is still useful. That's it.",
      "The lesson generalises: every affordance is a question. The question this one was asking was the wrong question.",
    ],
  },
];

function DiaryPage() {
  return (
    <main className="relative mx-auto w-full max-w-2xl px-5 py-10 md:py-14">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 t-meta text-muted-foreground shadow-soft backdrop-blur transition hover:bg-card/90 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Today
        </Link>
        <h1 className="mt-6 t-display">Notes.</h1>
        <p className="mt-2 t-body text-muted-foreground">
          Why this app is the way it is — written as we decide.
        </p>
      </div>

      <div className="space-y-8">
        {ENTRIES.map((entry, i) => (
          <motion.article
            key={`${entry.date}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 220, damping: 26 }}
            className="rounded-[2rem] border border-white/40 bg-card/85 p-7 shadow-soft backdrop-blur"
          >
            <div className="t-eyebrow text-muted-foreground">{entry.date}</div>
            <h2 className="mt-3 t-display-sm">{entry.title}</h2>
            <div className="mt-4 space-y-4">
              {entry.body.map((p, idx) => (
                <p key={idx} className="t-body text-foreground/90">
                  {p}
                </p>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
    </main>
  );
}
