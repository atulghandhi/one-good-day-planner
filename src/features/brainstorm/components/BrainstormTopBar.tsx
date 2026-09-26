import { Link } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Download,
  Layers,
  Link as LinkIcon,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { ThemePicker } from "@/components/ThemePicker";
import { cn } from "@/lib/utils";
import type { BrainstormExportFormat } from "../export";
import { controlStyle, floatingPanelStyle, shapeStyle, sketchChipStyle } from "../theme";
import type { BrainstormSearchResult } from "../search";
import type { BrainstormLibrary, ShapeKey, ShapeTheme, SketchPalette } from "../types";

type BrainstormTopBarProps = {
  library: BrainstormLibrary;
  totalIdeaCount: number;
  searchResults: BrainstormSearchResult[];
  searchQuery: string;
  libraryOpen: boolean;
  searchOpen: boolean;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  clearMode: boolean;
  onSearchQueryChange: (query: string) => void;
  onLibraryOpenChange: (open: boolean) => void;
  onSearchOpenChange: (open: boolean) => void;
  onCreateBrainstorm: () => void;
  onDuplicateBrainstorm: () => void;
  onDeleteBrainstorm: () => void;
  onActivateBrainstorm: (id: string) => void;
  onFocusSearchResult: (brainstormId: string, ideaId: string | null) => void;
  onCopyShareLink: () => void;
  onDownloadBrainstorm: (format: BrainstormExportFormat) => void;
  onOpenReset: () => void;
};

export function BrainstormTopBar({
  library,
  totalIdeaCount,
  searchResults,
  searchQuery,
  libraryOpen,
  searchOpen,
  shape,
  theme,
  sketchPalette,
  clearMode,
  onSearchQueryChange,
  onLibraryOpenChange,
  onSearchOpenChange,
  onCreateBrainstorm,
  onDuplicateBrainstorm,
  onDeleteBrainstorm,
  onActivateBrainstorm,
  onFocusSearchResult,
  onCopyShareLink,
  onDownloadBrainstorm,
  onOpenReset,
}: BrainstormTopBarProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const libraryCloseTimer = useRef<number | null>(null);
  const shareCloseTimer = useRef<number | null>(null);
  const isSketch = shape === "blob";
  const control = controlStyle(shape, theme, sketchPalette);
  const panel = floatingPanelStyle(shape, theme, sketchPalette);
  const iconButtonClass = cn(
    "grid h-9 w-9 sm:h-10 sm:w-10 place-items-center text-foreground shrink-0",
    theme.controlClassName,
  );
  const sketchButtonStyle = sketchChipStyle(shape, theme, sketchPalette);
  const activeSketchButtonStyle = sketchChipStyle(shape, theme, sketchPalette, true);
  const clearTimer = (timer: React.MutableRefObject<number | null>) => {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
  };
  const cancelLibraryClose = () => clearTimer(libraryCloseTimer);
  const cancelShareClose = () => clearTimer(shareCloseTimer);
  const scheduleLibraryClose = () => {
    cancelLibraryClose();
    libraryCloseTimer.current = window.setTimeout(() => onLibraryOpenChange(false), 2000);
  };
  const scheduleShareClose = () => {
    cancelShareClose();
    shareCloseTimer.current = window.setTimeout(() => setShareOpen(false), 2000);
  };
  const openLibrary = () => {
    cancelLibraryClose();
    onLibraryOpenChange(true);
    onSearchOpenChange(false);
    setShareOpen(false);
  };
  const openShare = () => {
    cancelShareClose();
    setShareOpen(true);
    onLibraryOpenChange(false);
    onSearchOpenChange(false);
  };

  useEffect(() => {
    if (!clearMode) return;
    setShareOpen(false);
    onLibraryOpenChange(false);
    onSearchOpenChange(false);
  }, [clearMode, onLibraryOpenChange, onSearchOpenChange]);

  useEffect(
    () => () => {
      if (libraryCloseTimer.current !== null) window.clearTimeout(libraryCloseTimer.current);
      if (shareCloseTimer.current !== null) window.clearTimeout(shareCloseTimer.current);
    },
    [],
  );

  return (
    <div className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
      <motion.div
        animate={clearMode ? { x: -220, opacity: 0, scale: 0.86 } : { x: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 20 }}
        style={{ pointerEvents: clearMode ? "none" : undefined }}
      >
        <Link
          to="/"
          className={cn(
            "inline-flex min-h-10 sm:min-h-12 items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 text-xs sm:text-sm font-bold text-muted-foreground transition hover:bg-card/90",
            theme.controlClassName,
          )}
          style={control}
          onClick={(event) => event.stopPropagation()}
          aria-hidden={clearMode}
          tabIndex={clearMode ? -1 : undefined}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Back to today</span>
          <span className="sm:hidden">Today</span>
        </Link>
      </motion.div>
      <motion.div
        className="relative flex items-center gap-1.5 sm:gap-2"
        animate={clearMode ? { x: 300, opacity: 0, scale: 0.86 } : { x: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 20 }}
        aria-hidden={clearMode}
        style={{ pointerEvents: clearMode ? "none" : undefined }}
      >
        <motion.button
          type="button"
          onMouseEnter={openLibrary}
          onMouseLeave={scheduleLibraryClose}
          onFocus={openLibrary}
          onBlur={scheduleLibraryClose}
          onClick={(event) => {
            event.stopPropagation();
            cancelLibraryClose();
            onLibraryOpenChange(!libraryOpen);
            onSearchOpenChange(false);
            setShareOpen(false);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={iconButtonClass}
          style={control}
          aria-label="Brainstorms"
          title="Brainstorms"
          tabIndex={clearMode ? -1 : undefined}
        >
          <Layers className="h-4 w-4" strokeWidth={2.5} />
        </motion.button>
        {totalIdeaCount >= 50 && (
          <motion.button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSearchOpenChange(!searchOpen);
              onLibraryOpenChange(false);
              setShareOpen(false);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={iconButtonClass}
            style={control}
            aria-label="Search brainstorms"
            title="Search brainstorms"
            tabIndex={clearMode ? -1 : undefined}
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </motion.button>
        )}
        <motion.button
          type="button"
          onMouseEnter={openShare}
          onMouseLeave={scheduleShareClose}
          onFocus={openShare}
          onBlur={scheduleShareClose}
          onClick={(event) => {
            event.stopPropagation();
            cancelShareClose();
            setShareOpen(!shareOpen);
            onLibraryOpenChange(false);
            onSearchOpenChange(false);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={iconButtonClass}
          style={control}
          aria-label="Share or export"
          title="Share or export"
          tabIndex={clearMode ? -1 : undefined}
        >
          <Share2 className="h-4 w-4" strokeWidth={2.5} />
        </motion.button>
        <ThemePicker
          buttonClassName={cn(
            "h-9 w-9 sm:h-10 sm:w-10 shrink-0 transition hover:bg-card/90",
            theme.controlClassName,
          )}
          iconClassName="h-4 w-4"
          buttonStyle={control}
          onOpenChange={(open) => {
            if (!open) return;
            cancelLibraryClose();
            cancelShareClose();
            onLibraryOpenChange(false);
            onSearchOpenChange(false);
            setShareOpen(false);
          }}
          panelStyle={isSketch ? panel : control}
          swatchShapeStyle={shapeStyle(shape)}
        />
        <motion.button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenReset();
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={iconButtonClass}
          style={control}
          aria-label="Reset brainstorm"
          tabIndex={clearMode ? -1 : undefined}
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
        </motion.button>

        <AnimatePresence>
          {libraryOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className={cn(
                "absolute right-0 top-12 sm:top-14 z-50 w-72 max-w-[calc(100vw-1.5rem)] p-3 shadow-pop",
                isSketch ? "border-2" : cn("backdrop-blur", theme.controlClassName),
              )}
              style={isSketch ? panel : control}
              onMouseEnter={cancelLibraryClose}
              onMouseLeave={scheduleLibraryClose}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={onCreateBrainstorm}
                  className={cn(
                    "inline-flex h-9 flex-1 items-center justify-center gap-1.5 px-3 text-xs font-bold transition",
                    isSketch ? "border-2" : "rounded-full bg-card/80 font-semibold hover:bg-card",
                  )}
                  style={isSketch ? sketchButtonStyle : undefined}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New
                </button>
                <button
                  type="button"
                  onClick={onDuplicateBrainstorm}
                  className={cn(
                    "grid h-9 w-9 place-items-center transition",
                    isSketch ? "border-2" : "rounded-full bg-card/80 hover:bg-card",
                  )}
                  style={isSketch ? sketchButtonStyle : undefined}
                  aria-label="Duplicate brainstorm"
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onDeleteBrainstorm}
                  className={cn(
                    "grid h-9 w-9 place-items-center text-muted-foreground transition",
                    isSketch
                      ? "border-2"
                      : "rounded-full bg-card/80 hover:bg-destructive hover:text-destructive-foreground",
                  )}
                  style={isSketch ? sketchButtonStyle : undefined}
                  aria-label="Delete brainstorm"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-72 space-y-1 overflow-auto pr-1">
                {library.brainstorms.map((brainstorm) => (
                  <button
                    key={brainstorm.id}
                    type="button"
                    onClick={() => onActivateBrainstorm(brainstorm.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition",
                      isSketch
                        ? "border-2"
                        : cn(
                            "rounded-full",
                            brainstorm.id === library.activeId
                              ? "bg-[color:var(--mit)]/25 text-foreground"
                              : "hover:bg-card/70",
                          ),
                    )}
                    style={
                      isSketch
                        ? brainstorm.id === library.activeId
                          ? activeSketchButtonStyle
                          : sketchButtonStyle
                        : undefined
                    }
                  >
                    <span className="min-w-0 truncate font-semibold">
                      {brainstorm.title || "Options"}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {brainstorm.ideas.length}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {shareOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className={cn(
                "absolute right-0 top-12 sm:top-14 z-50 w-56 max-w-[calc(100vw-1.5rem)] space-y-1 p-2 shadow-pop",
                isSketch ? "border-2" : cn("backdrop-blur", theme.controlClassName),
              )}
              style={isSketch ? panel : control}
              onMouseEnter={cancelShareClose}
              onMouseLeave={scheduleShareClose}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  onCopyShareLink();
                  setShareOpen(false);
                }}
                className={cn(
                  "flex h-9 w-full items-center gap-2 px-3 text-left text-xs font-bold transition",
                  isSketch ? "border-2" : "rounded-full bg-card/80 hover:bg-card",
                )}
                style={isSketch ? sketchButtonStyle : undefined}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Copy link
              </button>
              <button
                type="button"
                onClick={() => {
                  onDownloadBrainstorm("svg");
                  setShareOpen(false);
                }}
                className={cn(
                  "flex h-9 w-full items-center gap-2 px-3 text-left text-xs font-bold transition",
                  isSketch ? "border-2" : "rounded-full bg-card/80 hover:bg-card",
                )}
                style={isSketch ? sketchButtonStyle : undefined}
              >
                <Download className="h-3.5 w-3.5" />
                Download SVG
              </button>
              {(["png", "pdf", "markdown"] as const).map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => {
                    onDownloadBrainstorm(format);
                    setShareOpen(false);
                  }}
                  className={cn(
                    "flex h-9 w-full items-center gap-2 px-3 text-left text-xs font-bold transition",
                    isSketch ? "border-2" : "rounded-full bg-card/80 hover:bg-card",
                  )}
                  style={isSketch ? sketchButtonStyle : undefined}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download {format === "markdown" ? "Markdown" : format.toUpperCase()}
                </button>
              ))}
            </motion.div>
          )}
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className={cn(
                "absolute right-0 top-12 sm:top-14 z-50 w-80 max-w-[calc(100vw-1.5rem)] p-3 shadow-pop",
                isSketch ? "border-2" : cn("backdrop-blur", theme.controlClassName),
              )}
              style={isSketch ? panel : control}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                autoFocus
                placeholder="Search maps..."
                className={cn(
                  "mb-2 w-full px-3 py-2 text-sm outline-none",
                  isSketch
                    ? "border-0 border-b-2 bg-transparent focus:ring-0"
                    : "rounded-full bg-card/85 focus:ring-2 focus:ring-[color:var(--mit)]",
                )}
                style={
                  isSketch
                    ? {
                        borderColor: sketchPalette.markerDark,
                        color: sketchPalette.ink,
                        fontFamily: theme.fontFamily,
                      }
                    : undefined
                }
              />
              <div className="max-h-72 space-y-1 overflow-auto pr-1">
                {searchResults.slice(0, 14).map((result) => (
                  <button
                    key={`${result.brainstormId}-${result.ideaId ?? "title"}`}
                    type="button"
                    onClick={() => onFocusSearchResult(result.brainstormId, result.ideaId)}
                    className={cn(
                      "block w-full px-3 py-2 text-left text-xs transition",
                      isSketch ? "border-2" : "rounded-2xl hover:bg-card/70",
                    )}
                    style={isSketch ? sketchButtonStyle : undefined}
                  >
                    <span className="block truncate font-semibold">{result.label}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {result.context}
                    </span>
                  </button>
                ))}
                {searchQuery.trim() && searchResults.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
