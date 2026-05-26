import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, X } from "lucide-react";
import { buildPairUrl } from "@/lib/pairCode";
import { isoDate } from "@/features/planner/storage";
import type { PlannerState } from "@/features/planner/types";

type Props = {
  state: PlannerState;
};

export function SendToDevice({ state }: Props) {
  const [open, setOpen] = useState(false);
  const url = useMemo(() => (open ? buildPairUrl(isoDate(), state) : ""), [open, state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 t-meta text-muted-foreground transition hover:text-foreground"
      >
        Send to phone
        <span aria-hidden>→</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[55] grid place-items-center bg-foreground/25 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-labelledby="send-to-device-title"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-[2rem] border border-white/40 bg-card/95 p-6 shadow-pop backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-background/70 text-muted-foreground transition hover:bg-card hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 t-eyebrow text-muted-foreground">
                <Smartphone className="h-3.5 w-3.5 text-[color:var(--mit)]" />
                Send today to phone
              </div>
              <h2 id="send-to-device-title" className="mt-3 t-display-sm">
                Scan with your phone's camera.
              </h2>
              <p className="mt-2 t-body text-muted-foreground">
                Today's plan is encoded in the link — no server, no account.
              </p>

              <div className="mt-5 grid place-items-center rounded-2xl bg-white p-5 shadow-soft">
                <QRCodeSVG
                  value={url || "https://one-good-day.app"}
                  size={220}
                  marginSize={1}
                  level="M"
                />
              </div>

              <p className="mt-4 t-meta text-muted-foreground break-all">{url}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
