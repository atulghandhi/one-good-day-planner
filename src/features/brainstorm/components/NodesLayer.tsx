import { AnimatePresence } from "framer-motion";
import { IdeaNode } from "./IdeaNode";
import { sketchMarkerForDepth } from "../theme";
import type { Idea, Placed, ShapeKey, ShapeTheme, SketchPalette } from "../types";

type NodesLayerProps = {
  ideas: Idea[];
  placements: Placed[];
  depthById: Map<string, number>;
  descendantCountById: Map<string, number>;
  shape: ShapeKey;
  theme: ShapeTheme;
  sketchPalette: SketchPalette;
  lastAddedId: string | null;
  focusedId: string | null;
  focusedPathIds: Set<string>;
  focusedBranchIds: Set<string>;
  editingId: string | null;
  draggingId?: string;
  ignoreNextNodeClickRef: React.MutableRefObject<boolean>;
  onRemoveIdea: (id: string) => void;
  onSelectIdea: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCommitEdit: (id: string, text: string) => void;
  onStartDrag: (id: string, placement: Placed, event: React.PointerEvent<HTMLElement>) => void;
};

export function NodesLayer({
  ideas,
  placements,
  depthById,
  descendantCountById,
  shape,
  theme,
  sketchPalette,
  lastAddedId,
  focusedId,
  focusedPathIds,
  focusedBranchIds,
  editingId,
  draggingId,
  ignoreNextNodeClickRef,
  onRemoveIdea,
  onSelectIdea,
  onToggleCollapse,
  onStartEdit,
  onCommitEdit,
  onStartDrag,
}: NodesLayerProps) {
  return (
    <AnimatePresence>
      {ideas.map((idea, index) => {
        const placement = placements[index];
        if (!placement) return null;
        const depth = depthById.get(idea.id) ?? 0;
        return (
          <IdeaNode
            key={idea.id}
            idea={idea}
            placement={placement}
            depth={depth}
            shape={shape}
            theme={theme}
            sketchPalette={sketchPalette}
            sketchMarker={sketchMarkerForDepth(sketchPalette, depth)}
            isNew={idea.id === lastAddedId}
            isFocused={focusedId === idea.id}
            isRoot={!idea.parentId}
            isPathHighlighted={focusedPathIds.has(idea.id)}
            isDimmed={focusedId != null && !focusedBranchIds.has(idea.id)}
            isEditing={editingId === idea.id}
            isDragging={draggingId === idea.id}
            descendantCount={descendantCountById.get(idea.id) ?? 0}
            onRemove={() => onRemoveIdea(idea.id)}
            onToggleCollapse={() => onToggleCollapse(idea.id)}
            onSelect={() => {
              if (ignoreNextNodeClickRef.current) {
                ignoreNextNodeClickRef.current = false;
                return;
              }
              onSelectIdea(idea.id);
            }}
            onStartEdit={() => onStartEdit(idea.id)}
            onCommitEdit={(text) => onCommitEdit(idea.id, text)}
            onStartDrag={(event) => onStartDrag(idea.id, placement, event)}
          />
        );
      })}
    </AnimatePresence>
  );
}
