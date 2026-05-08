import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlStyle, shapeStyle } from "../theme";
import type { ShapeKey, ShapeTheme, SketchPalette } from "../types";

type MitOverwriteDialogProps = {
  open: boolean;
  existingText: string;
  replacementText: string;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  onCancel: () => void;
  onConfirm: () => void;
};

export function MitOverwriteDialog({
  open,
  existingText,
  replacementText,
  shape,
  theme,
  sketchPalette,
  onCancel,
  onConfirm,
}: MitOverwriteDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
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
            aria-labelledby="mit-overwrite-title"
            className={cn("relative w-full max-w-md p-7 shadow-pop", theme.controlClassName)}
            style={controlStyle(shape, theme, sketchPalette)}
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <div className="flex items-start gap-4">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center bg-gradient-mit text-primary-foreground shadow-pop"
                style={shapeStyle(shape)}
              >
                <AlertTriangle className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h2 id="mit-overwrite-title" className="font-display text-2xl tracking-tight">
                  Replace MIT?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your current MIT will be overwritten.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="bg-card/70 px-4 py-3" style={shapeStyle(shape)}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Current
                </p>
                <p className="mt-1 line-clamp-2 font-semibold">{existingText}</p>
              </div>
              <div className="bg-[color:var(--mit)]/20 px-4 py-3" style={shapeStyle(shape)}>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  New
                </p>
                <p className="mt-1 line-clamp-2 font-semibold">{replacementText}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 border border-border bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground shadow-soft transition-transform active:scale-[0.97]"
                style={shapeStyle(shape)}
              >
                Keep current
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 bg-gradient-mit px-5 py-3 text-sm font-semibold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
                style={shapeStyle(shape)}
              >
                Replace MIT
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
