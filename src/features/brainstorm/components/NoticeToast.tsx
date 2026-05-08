import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { controlStyle } from "../theme";
import type { ShapeKey, ShapeTheme, SketchPalette } from "../types";

type NoticeToastProps = {
  notice: string;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
};

export function NoticeToast({ notice, shape, theme, sketchPalette }: NoticeToastProps) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className={cn(
            "absolute left-1/2 top-16 z-[60] -translate-x-1/2 px-4 py-2 text-xs font-semibold shadow-pop backdrop-blur",
            theme.controlClassName,
          )}
          style={controlStyle(shape, theme, sketchPalette)}
        >
          {notice}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
