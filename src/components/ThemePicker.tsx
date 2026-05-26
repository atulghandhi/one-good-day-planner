import { useEffect, useRef, useState } from "react";
import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Paintbrush, Volume2, VolumeX } from "lucide-react";
import { THEMES, THEME_ORDER, type ThemeKey, applyTheme, loadSavedTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { isSoundOn, setSoundOn } from "@/lib/sound";

type ThemePickerProps = {
  buttonClassName?: string;
  iconClassName?: string;
  buttonStyle?: React.CSSProperties;
  onOpenChange?: (open: boolean) => void;
  panelStyle?: React.CSSProperties;
  swatchShapeStyle?: React.CSSProperties;
};

export function ThemePicker({
  buttonClassName,
  iconClassName,
  buttonStyle,
  onOpenChange,
  panelStyle,
  swatchShapeStyle,
}: ThemePickerProps = {}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ThemeKey>("blossom");
  const [soundOn, setSoundOnState] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const saved = loadSavedTheme();
    setActive(saved);
    applyTheme(saved);
    setSoundOnState(isSoundOn());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundOnState(next);
  };

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      onOpenChange?.(false);
    }, 500);
  };

  useEffect(() => () => cancelClose(), []);

  const pick = (key: ThemeKey) => {
    setActive(key);
    applyTheme(key);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
        onOpenChange?.(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <motion.button
        whileHover={{ rotate: -12, scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className={cn(
          "grid place-items-center text-foreground",
          buttonClassName ??
            "h-12 w-12 rounded-full bg-card shadow-pop transition hover:bg-card/90",
        )}
        style={buttonStyle}
        aria-label="Change theme"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          cancelClose();
          setOpen(true);
          onOpenChange?.(true);
        }}
        onFocus={() => {
          cancelClose();
          setOpen(true);
          onOpenChange?.(true);
        }}
        onBlur={scheduleClose}
      >
        <Paintbrush className={cn("h-5 w-5", iconClassName)} strokeWidth={2.5} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="swatches"
            initial={{ opacity: 0, y: -6, scale: 0.9, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-14 z-30 flex flex-col gap-2 rounded-2xl border border-white/40 bg-card/40 p-2.5 shadow-pop backdrop-blur-xl"
            style={panelStyle}
          >
            <motion.button
              type="button"
              onClick={toggleSound}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              title={soundOn ? "Sound on" : "Sound off"}
              aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
              className="grid h-9 w-9 place-items-center rounded-xl bg-card/80 text-muted-foreground shadow-soft transition hover:text-foreground"
            >
              {soundOn ? (
                <Volume2 className="h-4 w-4" strokeWidth={2.4} />
              ) : (
                <VolumeX className="h-4 w-4" strokeWidth={2.4} />
              )}
            </motion.button>
            <div className="h-px bg-border/60" aria-hidden />
            {THEME_ORDER.map((key, i) => {
              const t = THEMES[key].tokens;
              const swatch = `linear-gradient(135deg, ${t.mit}, ${t.should} 55%, ${t.could})`;
              const isActive = key === active;
              return (
                <motion.button
                  key={key}
                  type="button"
                  initial={{ opacity: 0, x: 8, scale: 0.6 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    delay: i * 0.04,
                    type: "spring",
                    stiffness: 400,
                    damping: 18,
                  }}
                  whileHover={{ scale: 1.12, x: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => pick(key)}
                  title={THEMES[key].name}
                  aria-label={`${THEMES[key].name} theme`}
                  className={`h-9 w-9 rounded-xl ring-2 ring-offset-2 ring-offset-transparent transition-shadow ${
                    isActive ? "ring-foreground/70 shadow-pop" : "ring-transparent shadow-soft"
                  }`}
                  style={{ background: swatch, ...swatchShapeStyle }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
