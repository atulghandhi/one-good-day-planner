import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { decodeState } from "@/lib/pairCode";
import { saveState } from "@/features/planner/storage";
import { htmlToPlainText } from "@/features/planner/text";

export const Route = createFileRoute("/receive")({
  component: ReceivePage,
});

function ReceivePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ready" | "invalid" | "applied">("loading");
  const [payload, setPayload] = useState<ReturnType<typeof decodeState>>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const frag = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(frag);
    const token = params.get("d");
    if (!token) {
      setStatus("invalid");
      return;
    }
    const decoded = decodeState(token);
    if (!decoded) {
      setStatus("invalid");
      return;
    }
    setPayload(decoded);
    setStatus("ready");
  }, []);

  const mitPreview = useMemo(() => {
    if (!payload) return "";
    return htmlToPlainText(payload.s.mit).trim();
  }, [payload]);

  const apply = async () => {
    if (!payload) return;
    await saveState(payload.s);
    setStatus("applied");
    setTimeout(() => navigate({ to: "/" }), 700);
  };

  return (
    <main className="relative mx-auto w-full max-w-md px-5 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 t-meta text-muted-foreground shadow-soft backdrop-blur transition hover:bg-card/90 hover:text-foreground"
      >
        Today
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="mt-6 rounded-[2rem] border border-white/40 bg-card/95 p-6 shadow-pop backdrop-blur-xl"
      >
        <div className="flex items-center gap-2 t-eyebrow text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--mit)]" />
          From another device
        </div>

        {status === "loading" && <p className="mt-4 t-body text-muted-foreground">a moment.</p>}

        {status === "invalid" && (
          <>
            <h1 className="mt-3 t-display-sm">Couldn't read that link.</h1>
            <p className="mt-3 t-body text-muted-foreground">
              The QR code may be incomplete or expired. Try scanning again from the source device.
            </p>
          </>
        )}

        {status === "ready" && payload && (
          <>
            <h1 className="mt-3 t-display-sm">Bring today over?</h1>
            <p className="mt-3 t-body text-muted-foreground">
              From {payload.d}. This will replace anything currently saved here.
            </p>

            {mitPreview && (
              <div className="mt-5 rounded-2xl border border-border/50 bg-background/60 px-4 py-3">
                <div className="t-eyebrow text-muted-foreground">The one thing</div>
                <p className="mt-1 t-body italic">"{mitPreview}"</p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={apply}
                className="rounded-full bg-gradient-mit px-5 py-3 t-body-lg font-semibold text-[color:var(--mit-foreground)] shadow-pop transition hover:scale-[1.01]"
              >
                Bring it over
              </button>
              <Link
                to="/"
                className="rounded-full bg-card px-5 py-3 text-center t-body text-muted-foreground shadow-soft transition hover:bg-muted/60 hover:text-foreground"
              >
                Cancel
              </Link>
            </div>
          </>
        )}

        {status === "applied" && (
          <>
            <h1 className="mt-3 t-display-sm">Brought over.</h1>
            <p className="mt-3 t-body text-muted-foreground">Opening today…</p>
          </>
        )}
      </motion.div>
    </main>
  );
}
