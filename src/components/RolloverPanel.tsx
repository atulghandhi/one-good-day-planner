import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RolloverTask, RolloverTaskKind } from "@/features/planner/types";

type RolloverPanelProps = {
  tasks: RolloverTask[];
  onClaimTask: (task: RolloverTask) => void;
};

const KIND_BORDER: Record<RolloverTaskKind, string> = {
  mit: "border-[color:var(--mit)]/60",
  should: "border-[color:var(--should)]/60",
  could: "border-[color:var(--could)]/60",
};

function ordinalSuffix(day: number) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function longDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const month = date.toLocaleDateString(undefined, { month: "long" });
  const day = date.getDate();
  return `${weekday} ${day}${ordinalSuffix(day)} ${month}`;
}

function groupTasksByDate(tasks: RolloverTask[]) {
  return tasks.reduce<Array<{ date: string; tasks: RolloverTask[] }>>((groups, task) => {
    const current = groups[groups.length - 1];
    if (current?.date === task.date) {
      current.tasks.push(task);
      return groups;
    }
    groups.push({ date: task.date, tasks: [task] });
    return groups;
  }, []);
}

function RolloverCard({ task, onClaimTask }: { task: RolloverTask; onClaimTask: () => void }) {
  return (
    <button
      type="button"
      onClick={onClaimTask}
      className={cn(
        "group relative w-full rounded-3xl border-2 bg-card/86 p-3 pr-9 text-left transition hover:bg-card",
        KIND_BORDER[task.kind],
      )}
    >
      <p className="line-clamp-3 whitespace-pre-line text-sm font-semibold leading-snug text-foreground">
        {task.text}
      </p>
      {task.kind === "mit" && task.steps.length > 0 && (
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-snug text-muted-foreground">
          {task.steps.slice(0, 4).map((step, index) => (
            <li key={`${task.id}-${index}`} className="line-clamp-1">
              {step.text}
            </li>
          ))}
        </ol>
      )}
      <ArrowRight
        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 transition group-hover:translate-x-1 group-hover:text-foreground"
        strokeWidth={2.6}
      />
    </button>
  );
}

function PanelContent({ tasks, onClaimTask }: RolloverPanelProps) {
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      {groupTasksByDate(tasks).map((group, index) => (
        <section key={group.date} className="space-y-3">
          {index > 0 && <div className="h-px bg-border/70" aria-hidden />}
          <div className="px-1 pt-1 text-left text-[11px] font-bold text-muted-foreground">
            {longDate(group.date)}
          </div>
          <div className="space-y-3">
            {group.tasks.map((task) => (
              <RolloverCard key={task.id} task={task} onClaimTask={() => onClaimTask(task)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function RolloverPanel({ tasks, onClaimTask }: RolloverPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  if (tasks.length === 0) return null;

  return (
    <>
      <AnimatePresence initial={false}>
        {!desktopCollapsed && (
          <motion.aside
            className="fixed bottom-8 left-5 top-28 z-30 hidden w-72 flex-col rounded-[2rem] border border-white/45 bg-card/58 p-4 backdrop-blur-xl xl:flex"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <button
              type="button"
              onClick={() => setDesktopCollapsed(true)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-card/65 text-muted-foreground transition hover:bg-card hover:text-foreground"
              aria-label="Collapse unfinished tasks"
              title="Collapse"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.7} />
            </button>
            <div className="flex min-h-0 flex-1">
              <PanelContent tasks={tasks} onClaimTask={onClaimTask} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {desktopCollapsed && (
        <motion.button
          type="button"
          onClick={() => setDesktopCollapsed(false)}
          initial={{ x: -28, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed left-5 top-28 z-30 hidden h-10 w-10 place-items-center rounded-full border border-white/45 bg-card/58 text-muted-foreground backdrop-blur-xl transition hover:bg-card/80 hover:text-foreground xl:grid"
          aria-label="Expand unfinished tasks"
          title="Expand unfinished tasks"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.7} />
        </motion.button>
      )}

      <motion.button
        type="button"
        onClick={() => setMobileOpen(true)}
        whileTap={{ scale: 0.92 }}
        className="fixed left-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-full border border-border/70 bg-card text-foreground xl:hidden"
        aria-label="Open unfinished tasks"
      >
        <Menu className="h-5 w-5" strokeWidth={2.6} />
      </motion.button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-sm xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              className="absolute bottom-0 left-0 top-0 flex w-[min(21rem,88vw)] flex-col rounded-r-[2rem] border-r border-white/45 bg-card/76 p-4 backdrop-blur-xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-card/65 text-muted-foreground transition hover:bg-card hover:text-foreground"
                aria-label="Collapse unfinished tasks"
                title="Collapse"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.7} />
              </button>
              <PanelContent
                tasks={tasks}
                onClaimTask={(task) => {
                  onClaimTask(task);
                  setMobileOpen(false);
                }}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
