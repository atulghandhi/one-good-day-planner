import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { PillInput } from "./PillInput";

type Tone = "should" | "could";

type Props = {
  title: string;
  hint: string;
  emoji: string;
  tone: Tone;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
};

export function TaskSection({
  title,
  hint,
  emoji,
  tone,
  items,
  onChange,
  placeholder,
}: Props) {
  const update = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };

  const add = () => onChange([...items, ""]);

  const remove = (i: number) => {
    if (items.length === 1) {
      onChange([""]);
      return;
    }
    onChange(items.filter((_, idx) => idx !== i));
  };

  const gradient =
    tone === "should" ? "bg-gradient-should" : "bg-gradient-could";

  return (
    <motion.section
      layout
      className="rounded-[2rem] bg-card/70 backdrop-blur-sm p-6 md:p-7 shadow-soft border border-white/40"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-10 w-10 place-items-center rounded-2xl ${gradient} text-xl shadow-pop`}
            aria-hidden
          >
            {emoji}
          </span>
          <div>
            <h2 className="font-display text-xl tracking-tight leading-none">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          </div>
        </div>
        <motion.button
          onClick={add}
          whileTap={{ scale: 0.85, rotate: -10 }}
          whileHover={{ scale: 1.08, rotate: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 14 }}
          className={`grid h-11 w-11 place-items-center rounded-full ${gradient} text-foreground shadow-pop`}
          aria-label={`Add to ${title}`}
          tabIndex={-1}
        >
          <Plus className="h-5 w-5" strokeWidth={2.8} />
        </motion.button>
      </header>

      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {items.map((value, i) => (
            <motion.li
              key={`${tone}-${i}`}
              layout
              initial={{ opacity: 0, height: 0, scale: 0.92 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              className="group relative overflow-visible"
            >
              <PillInput
                tone={tone}
                value={value}
                autoFocus={i === items.length - 1 && i > 0 && value === ""}
                onChange={(e) => update(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const list = e.currentTarget.closest("ul");
                    const inputs = list
                      ? Array.from(
                          list.querySelectorAll<HTMLInputElement>("input"),
                        )
                      : [];
                    const idx = inputs.indexOf(e.currentTarget);
                    const next = inputs[idx + 1];
                    if (next) {
                      next.focus();
                      return;
                    }
                    if (value.trim().length > 0) {
                      add();
                    }
                  }
                }}
                placeholder={placeholder}
              />
              {items.length > 1 && (
                <button
                  onClick={() => remove(i)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/70 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Remove"
                  type="button"
                  tabIndex={-1}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}
