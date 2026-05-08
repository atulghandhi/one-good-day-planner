import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Copy, Layers, Plus, RotateCcw, Search, Share2, Trash2 } from "lucide-react";
import { ThemePicker } from "@/components/ThemePicker";
import { cn } from "@/lib/utils";
import { controlStyle, shapeStyle } from "../theme";
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
  onSearchQueryChange: (query: string) => void;
  onLibraryOpenChange: (open: boolean) => void;
  onSearchOpenChange: (open: boolean) => void;
  onCreateBrainstorm: () => void;
  onDuplicateBrainstorm: () => void;
  onDeleteBrainstorm: () => void;
  onActivateBrainstorm: (id: string) => void;
  onFocusSearchResult: (brainstormId: string, ideaId: string | null) => void;
  onShareBrainstorm: () => void;
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
  onSearchQueryChange,
  onLibraryOpenChange,
  onSearchOpenChange,
  onCreateBrainstorm,
  onDuplicateBrainstorm,
  onDeleteBrainstorm,
  onActivateBrainstorm,
  onFocusSearchResult,
  onShareBrainstorm,
  onOpenReset,
}: BrainstormTopBarProps) {
  const control = controlStyle(shape, theme, sketchPalette);
  const iconButtonClass = cn(
    "grid h-10 w-10 place-items-center text-foreground",
    theme.controlClassName,
  );

  return (
    <div className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between px-5 py-4">
      <Link
        to="/"
        className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-card/90",
          theme.controlClassName,
        )}
        style={control}
        onClick={(event) => event.stopPropagation()}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to today
      </Link>
      <div className="relative flex items-center gap-2">
        <motion.button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onLibraryOpenChange(!libraryOpen);
            onSearchOpenChange(false);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={iconButtonClass}
          style={control}
          aria-label="Brainstorms"
          title="Brainstorms"
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
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={iconButtonClass}
            style={control}
            aria-label="Search brainstorms"
            title="Search brainstorms"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </motion.button>
        )}
        <motion.button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onShareBrainstorm();
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={iconButtonClass}
          style={control}
          aria-label="Copy share link"
          title="Copy share link"
        >
          <Share2 className="h-4 w-4" strokeWidth={2.5} />
        </motion.button>
        <ThemePicker
          buttonClassName={cn("h-10 w-10 transition hover:bg-card/90", theme.controlClassName)}
          iconClassName="h-4 w-4"
          buttonStyle={{
            ...control,
            height: 40,
            width: 40,
          }}
          panelStyle={control}
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
                "absolute right-0 top-12 z-50 w-72 p-2 shadow-pop backdrop-blur",
                theme.controlClassName,
              )}
              style={control}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={onCreateBrainstorm}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-card/80 px-3 text-xs font-semibold hover:bg-card"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New
                </button>
                <button
                  type="button"
                  onClick={onDuplicateBrainstorm}
                  className="grid h-9 w-9 place-items-center rounded-full bg-card/80 hover:bg-card"
                  aria-label="Duplicate brainstorm"
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onDeleteBrainstorm}
                  className="grid h-9 w-9 place-items-center rounded-full bg-card/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
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
                      "flex w-full items-center justify-between gap-2 rounded-full px-3 py-2 text-left text-xs transition",
                      brainstorm.id === library.activeId
                        ? "bg-[color:var(--mit)]/25 text-foreground"
                        : "hover:bg-card/70",
                    )}
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
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className={cn(
                "absolute right-0 top-12 z-50 w-80 p-2 shadow-pop backdrop-blur",
                theme.controlClassName,
              )}
              style={control}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                autoFocus
                placeholder="Search maps..."
                className="mb-2 w-full rounded-full bg-card/85 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--mit)]"
              />
              <div className="max-h-72 space-y-1 overflow-auto pr-1">
                {searchResults.slice(0, 14).map((result) => (
                  <button
                    key={`${result.brainstormId}-${result.ideaId ?? "title"}`}
                    type="button"
                    onClick={() => onFocusSearchResult(result.brainstormId, result.ideaId)}
                    className="block w-full rounded-2xl px-3 py-2 text-left text-xs hover:bg-card/70"
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
      </div>
    </div>
  );
}
