import { seoHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { loadReflections } from "@/features/planner/reflections";
import type { Reflection } from "@/features/planner/types";

export const Route = createFileRoute("/reflect")({
  head: () =>
    seoHead({
      title: "Your Daily Reflections | One Good Day",
      description: "Your personal daily reflections saved in this browser.",
      path: "/reflect",
      noindex: true,
    }),
  component: ReflectTimeline,
});

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function ReflectTimeline() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadReflections().then((map) => {
      const list = Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
      setReflections(list);
      setLoaded(true);
    });
  }, []);

  const empty = useMemo(() => loaded && reflections.length === 0, [loaded, reflections]);

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
        <h1 className="mt-6 t-display">Reflections.</h1>
        <p className="mt-2 t-body text-muted-foreground">A quiet record of how days landed.</p>
      </div>

      {empty && (
        <div className="rounded-[2rem] border border-white/40 bg-card/60 p-8 text-center shadow-soft backdrop-blur">
          <p className="t-body text-muted-foreground">
            Nothing here yet. When you finish a day's One Thing, you'll be able to write a sentence
            about how it went. They'll appear here.
          </p>
        </div>
      )}

      <ul className="space-y-4">
        {reflections.map((r, i) => (
          <motion.li
            key={r.date}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 220, damping: 26 }}
            className="rounded-[1.8rem] border border-white/40 bg-card/80 p-5 shadow-soft backdrop-blur"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="t-display-sm">{formatDate(r.date)}</h2>
              <span className="t-meta text-muted-foreground">
                {r.mitDone ? "one thing: done" : "one thing: open"}
              </span>
            </div>
            {r.mitText && <p className="mt-2 t-meta text-muted-foreground">"{r.mitText}"</p>}
            {r.text && (
              <p className="mt-3 t-body italic text-foreground/90 whitespace-pre-wrap">{r.text}</p>
            )}
          </motion.li>
        ))}
      </ul>
    </main>
  );
}
