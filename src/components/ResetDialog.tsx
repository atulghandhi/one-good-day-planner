import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  listName?: string;
};

export function ResetDialog({ open, onCancel, onConfirm, listName = "today's plan" }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-[2rem] bg-card p-8 shadow-pop"
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-mit text-primary-foreground shadow-pop">
                <RotateCcw className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="font-display text-2xl tracking-tight">Start fresh?</h2>
                <p className="text-sm text-muted-foreground">
                  This wipes {listName}. It can't be undone.
                </p>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-full border border-border bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground shadow-soft transition-transform active:scale-[0.97]"
              >
                Keep my list
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-full bg-gradient-mit px-5 py-3 text-sm font-semibold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
              >
                Yes, reset it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
