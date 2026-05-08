import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ResetDialog } from "./ResetDialog";
import {
  CENTER_BOX,
  EMPTY,
  MAX_ZOOM,
  MIN_ZOOM,
  PAGE_THEME_VIEWPORT_STROKE,
  WORLD_CENTER,
} from "@/features/brainstorm/constants";
import { ConnectorLayer } from "@/features/brainstorm/components/ConnectorLayer";
import { BrainstormTopBar } from "@/features/brainstorm/components/BrainstormTopBar";
import { IdeaInputBar } from "@/features/brainstorm/components/IdeaInputBar";
import { MitOverwriteDialog } from "@/features/brainstorm/components/MitOverwriteDialog";
import { NoticeToast } from "@/features/brainstorm/components/NoticeToast";
import { NodeActionBar } from "@/features/brainstorm/components/NodeActionBar";
import { NodesLayer } from "@/features/brainstorm/components/NodesLayer";
import { OverviewMap } from "@/features/brainstorm/components/OverviewMap";
import { SketchDoodles } from "@/features/brainstorm/components/SketchDoodles";
import { TitleNode } from "@/features/brainstorm/components/TitleNode";
import { ZoomControls } from "@/features/brainstorm/components/ZoomControls";
import { computeDepthMap } from "@/features/brainstorm/graph";
import { useBrainstormLibrary } from "@/features/brainstorm/hooks/useBrainstormLibrary";
import { estimateCardSize, findOpenSpot, layoutIdeas } from "@/features/brainstorm/layout";
import { clamp } from "@/features/brainstorm/math";
import {
  childIdeasToTaskItems,
  createPlannerSendUpdate,
  type PlannerTarget,
} from "@/features/brainstorm/plannerBridge";
import { buildTodayBrainstorm } from "@/features/brainstorm/plannerImport";
import { decodeBrainstormShare, encodeBrainstormShare } from "@/features/brainstorm/sharing";
import { useBrainstormSearch } from "@/features/brainstorm/search";
import { SHAPE_THEMES, SKETCH_PALETTES } from "@/features/brainstorm/theme";
import type { CanvasView, Idea, Placed } from "@/features/brainstorm/types";
import { loadState, saveState } from "@/features/planner/storage";
import type { TaskItem } from "@/features/planner/types";
import { cn } from "@/lib/utils";

type Interaction =
  | {
      type: "pan";
      pointerId: number;
      lastX: number;
      lastY: number;
      moved: boolean;
    }
  | {
      type: "node";
      pointerId: number;
      id: string;
      offsetX: number;
      offsetY: number;
      startX: number;
      startY: number;
      moved: boolean;
    };

export function Brainstorm() {
  const [draft, setDraft] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [dragLive, setDragLive] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingMitOverwrite, setPendingMitOverwrite] = useState<{
    idea: Idea;
    childItems: TaskItem[];
    existingMitText: string;
  } | null>(null);
  const [centerActive, setCenterActive] = useState(false);
  const [pageTheme, setPageTheme] = useState("blossom");
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<CanvasView>({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  const initializedViewRef = useRef(false);
  const interactionRef = useRef<Interaction | null>(null);
  const dragLiveRef = useRef<typeof dragLive>(null);
  const pendingDragRef = useRef<typeof dragLive>(null);
  const dragRafRef = useRef(0);
  const cameraRafRef = useRef(0);
  const routeImportRef = useRef(false);
  const ignoreNextClickRef = useRef(false);
  const ignoreNextNodeClickRef = useRef(false);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }, []);

  const resetDocumentUi = useCallback(() => {
    setFocusedId(null);
    setEditingId(null);
    setLibraryOpen(false);
    setSearchOpen(false);
    setPendingMitOverwrite(null);
  }, []);

  const resetNewDocumentUi = useCallback(() => {
    resetDocumentUi();
    setDraft("");
  }, [resetDocumentUi]);

  const {
    library,
    hydrated,
    state,
    setState,
    activateBrainstorm,
    addBrainstormFromState,
    createNewBrainstorm,
    duplicateBrainstorm,
    deleteActiveBrainstorm,
  } = useBrainstormLibrary({
    showNotice,
    onDocumentChange: resetDocumentUi,
    onNewDocument: resetNewDocumentUi,
  });

  const shape = state.shape;
  const theme = SHAPE_THEMES[shape];
  const sketchPalette = SKETCH_PALETTES[pageTheme] ?? SKETCH_PALETTES.blossom;

  useEffect(() => {
    if (!hydrated || routeImportRef.current || typeof window === "undefined") return;
    routeImportRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("brainstorm");
    const fromToday = params.get("today") === "1";

    if (shared) {
      const decoded = decodeBrainstormShare(shared);
      if (decoded) {
        addBrainstormFromState(decoded, "Shared brainstorm imported");
      } else {
        showNotice("That brainstorm link could not be opened");
      }
      params.delete("brainstorm");
    }

    if (fromToday) {
      void loadState().then((planner) => {
        addBrainstormFromState(buildTodayBrainstorm(planner), "Today mapped as a brainstorm");
      });
      params.delete("today");
    }

    if (shared || fromToday) {
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }, [addBrainstormFromState, hydrated, showNotice]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => setPageTheme(root.getAttribute("data-theme") ?? "blossom");
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!viewportRef.current) return;
    const element = viewportRef.current;
    const update = () => {
      const next = { w: element.clientWidth, h: element.clientHeight };
      setViewportSize(next);
      if (!initializedViewRef.current && next.w > 0 && next.h > 0) {
        initializedViewRef.current = true;
        setView({
          x: next.w / 2 - WORLD_CENTER,
          y: next.h / 2 - WORLD_CENTER,
          zoom: 1,
        });
      }
    };
    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
      if (cameraRafRef.current) cancelAnimationFrame(cameraRafRef.current);
    },
    [],
  );

  const depthById = useMemo(() => computeDepthMap(state.ideas), [state.ideas]);
  const placements = useMemo(() => layoutIdeas(state.ideas, shape), [shape, state.ideas]);

  const placementById = useMemo(() => {
    const map = new Map<string, Placed>();
    state.ideas.forEach((idea, index) => {
      const placement = placements[index];
      if (placement) map.set(idea.id, placement);
    });
    return map;
  }, [placements, state.ideas]);

  const displayPlacements = useMemo(
    () =>
      placements.map((placement, index) => {
        const idea = state.ideas[index];
        return dragLive && idea?.id === dragLive.id
          ? { ...placement, x: dragLive.x, y: dragLive.y }
          : placement;
      }),
    [dragLive, placements, state.ideas],
  );

  const animateViewTo = useCallback((target: CanvasView, duration = 360) => {
    if (cameraRafRef.current) cancelAnimationFrame(cameraRafRef.current);
    const start = viewRef.current;
    const startedAt = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = ease(progress);
      const next = {
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        zoom: start.zoom + (target.zoom - start.zoom) * eased,
      };
      viewRef.current = next;
      setView(next);

      if (progress < 1) {
        cameraRafRef.current = requestAnimationFrame(step);
      } else {
        cameraRafRef.current = 0;
      }
    };

    cameraRafRef.current = requestAnimationFrame(step);
  }, []);

  const focusBoxes = useCallback(
    (boxes: Placed[], animated = true) => {
      if (boxes.length === 0 || viewportSize.w === 0 || viewportSize.h === 0) return;
      const minX = Math.min(...boxes.map((box) => box.x - box.w / 2)) - 180;
      const maxX = Math.max(...boxes.map((box) => box.x + box.w / 2)) + 180;
      const minY = Math.min(...boxes.map((box) => box.y - box.h / 2)) - 150;
      const maxY = Math.max(...boxes.map((box) => box.y + box.h / 2)) + 190;
      const neededZoom = Math.min(
        viewportSize.w / Math.max(1, maxX - minX),
        viewportSize.h / Math.max(1, maxY - minY),
      );
      const zoom = clamp(Math.min(viewRef.current.zoom, neededZoom), MIN_ZOOM, MAX_ZOOM);
      const target = {
        zoom,
        x: viewportSize.w / 2 - (WORLD_CENTER + (minX + maxX) / 2) * zoom,
        y: viewportSize.h / 2 - (WORLD_CENTER + (minY + maxY) / 2) * zoom,
      };
      if (animated) animateViewTo(target);
      else {
        viewRef.current = target;
        setView(target);
      }
    },
    [animateViewTo, viewportSize.h, viewportSize.w],
  );

  const getBranchBoxes = useCallback(
    (id: string, extraBoxes: Placed[] = []) => {
      const ids = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        state.ideas.forEach((idea) => {
          if (idea.parentId && ids.has(idea.parentId) && !ids.has(idea.id)) {
            ids.add(idea.id);
            changed = true;
          }
        });
      }

      const boxes = state.ideas.flatMap((idea, index) => {
        if (!ids.has(idea.id)) return [];
        const placement = displayPlacements[index];
        return placement ? [placement] : [];
      });
      return [...boxes, ...extraBoxes];
    },
    [displayPlacements, state.ideas],
  );

  const selectIdea = useCallback(
    (id: string, options: { center?: boolean } = {}) => {
      setFocusedId(id);
      setCenterActive(false);
      if (options.center) focusBoxes(getBranchBoxes(id));
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [focusBoxes, getBranchBoxes],
  );

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const current = viewRef.current;
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - current.x) / current.zoom - WORLD_CENTER,
      y: (clientY - rect.top - current.y) / current.zoom - WORLD_CENTER,
    };
  }, []);

  const focusWorldPoint = useCallback(
    (point: { x: number; y: number }, zoom = viewRef.current.zoom, animated = false) => {
      const target = {
        zoom,
        x: viewportSize.w / 2 - (WORLD_CENTER + point.x) * zoom,
        y: viewportSize.h / 2 - (WORLD_CENTER + point.y) * zoom,
      };
      if (animated) animateViewTo(target);
      else {
        viewRef.current = target;
        setView(target);
      }
    },
    [animateViewTo, viewportSize.h, viewportSize.w],
  );

  const scheduleDragLive = useCallback((next: { id: string; x: number; y: number }) => {
    pendingDragRef.current = next;
    dragLiveRef.current = next;
    if (dragRafRef.current) return;
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = 0;
      setDragLive(pendingDragRef.current);
    });
  }, []);

  const addIdea = () => {
    const text = draft.trim();
    if (!text) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const parentId = focusedId ?? undefined;
    const depth = parentId ? (depthById.get(parentId) ?? 0) + 1 : 0;
    const size = estimateCardSize(text, shape, depth);
    const parent = parentId ? (placementById.get(parentId) ?? CENTER_BOX) : CENTER_BOX;
    const parentIdea = parentId ? state.ideas.find((idea) => idea.id === parentId) : undefined;
    const parentOrigin =
      parentIdea?.parentId != null
        ? (placementById.get(parentIdea.parentId) ?? CENTER_BOX)
        : CENTER_BOX;
    const preferredAngle =
      shape === "blob" && parentId
        ? Math.atan2(parent.y - parentOrigin.y, parent.x - parentOrigin.x)
        : undefined;
    const occupied = [CENTER_BOX, ...displayPlacements];
    const siblingIndex = state.ideas.filter(
      (idea) => (idea.parentId ?? "center") === (parentId ?? "center"),
    ).length;
    const placement = findOpenSpot(parent, size, occupied, siblingIndex, shape, preferredAngle);

    setState((current) => ({
      ...current,
      ideas: [
        ...current.ideas,
        {
          id,
          text,
          parentId,
          cx: placement.x,
          cy: placement.y,
        },
      ],
    }));
    setLastAddedId(id);
    setDraft("");
    if (parentId) {
      focusBoxes(getBranchBoxes(parentId, [placement]));
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeIdea = (id: string) => {
    setState((current) => ({
      ...current,
      ideas: current.ideas
        .filter((idea) => idea.id !== id)
        .map((idea) => (idea.parentId === id ? { ...idea, parentId: undefined } : idea)),
    }));
    if (focusedId === id) setFocusedId(null);
    if (editingId === id) setEditingId(null);
    if (dragLive?.id === id) setDragLive(null);
  };

  const commitEdit = (id: string, text: string) => {
    setState((current) => ({
      ...current,
      ideas: current.ideas.map((idea) => (idea.id === id ? { ...idea, text } : idea)),
    }));
    setEditingId(null);
  };

  const persistDraggedIdea = (id: string, x: number, y: number) => {
    setState((current) => ({
      ...current,
      ideas: current.ideas.map((idea) => (idea.id === id ? { ...idea, cx: x, cy: y } : idea)),
    }));
  };

  const handleViewportPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      type: "pan",
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };
  };

  const handleNodePointerDown = (
    id: string,
    placement: Placed,
    event: React.PointerEvent<HTMLElement>,
  ) => {
    if (event.button !== 0 || editingId === id) return;
    event.stopPropagation();
    viewportRef.current?.setPointerCapture(event.pointerId);
    const point = screenToWorld(event.clientX, event.clientY);
    setFocusedId(id);
    setCenterActive(false);
    interactionRef.current = {
      type: "node",
      pointerId: event.pointerId,
      id,
      offsetX: point.x - placement.x,
      offsetY: point.y - placement.y,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    if (interaction.type === "pan") {
      const dx = event.clientX - interaction.lastX;
      const dy = event.clientY - interaction.lastY;
      if (Math.hypot(dx, dy) > 0.5) interaction.moved = true;
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
      setView((current) => {
        const next = {
          ...current,
          x: current.x + dx,
          y: current.y + dy,
        };
        viewRef.current = next;
        return next;
      });
      return;
    }

    const distance = Math.hypot(
      event.clientX - interaction.startX,
      event.clientY - interaction.startY,
    );
    if (distance > 3) interaction.moved = true;
    const point = screenToWorld(event.clientX, event.clientY);
    scheduleDragLive({
      id: interaction.id,
      x: point.x - interaction.offsetX,
      y: point.y - interaction.offsetY,
    });
  };

  const endInteraction = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;

    if (interaction.moved) {
      ignoreNextClickRef.current = true;
      window.setTimeout(() => {
        ignoreNextClickRef.current = false;
      }, 120);
    }

    if (interaction.type === "node") {
      ignoreNextClickRef.current = true;
      window.setTimeout(() => {
        ignoreNextClickRef.current = false;
      }, 120);
      const live = dragLiveRef.current;
      if (live && live.id === interaction.id && interaction.moved) {
        persistDraggedIdea(interaction.id, live.x, live.y);
      }
      if (interaction.moved) {
        ignoreNextNodeClickRef.current = true;
        setFocusedId(null);
        window.setTimeout(() => {
          ignoreNextNodeClickRef.current = false;
        }, 120);
      } else {
        selectIdea(interaction.id, { center: true });
      }
      dragLiveRef.current = null;
      pendingDragRef.current = null;
      setDragLive(null);
    }

    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId);
    }
    interactionRef.current = null;
  };

  const zoomAtClientPoint = useCallback((clientX: number, clientY: number, deltaY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const current = viewRef.current;
    const nextZoom = clamp(current.zoom * Math.exp(-deltaY * 0.001), MIN_ZOOM, MAX_ZOOM);
    const canvasX = (clientX - rect.left - current.x) / current.zoom;
    const canvasY = (clientY - rect.top - current.y) / current.zoom;
    const next = {
      zoom: nextZoom,
      x: clientX - rect.left - canvasX * nextZoom,
      y: clientY - rect.top - canvasY * nextZoom,
    };

    viewRef.current = next;
    setView(next);
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const nextZoom = clamp(viewRef.current.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      const visibleCenter = {
        x: (viewportSize.w / 2 - viewRef.current.x) / viewRef.current.zoom - WORLD_CENTER,
        y: (viewportSize.h / 2 - viewRef.current.y) / viewRef.current.zoom - WORLD_CENTER,
      };
      focusWorldPoint(visibleCenter, nextZoom);
    },
    [focusWorldPoint, viewportSize.h, viewportSize.w],
  );

  const fitChart = useCallback(() => {
    const boxes = [CENTER_BOX, ...displayPlacements];
    const minX = Math.min(...boxes.map((box) => box.x - box.w / 2)) - 180;
    const maxX = Math.max(...boxes.map((box) => box.x + box.w / 2)) + 180;
    const minY = Math.min(...boxes.map((box) => box.y - box.h / 2)) - 160;
    const maxY = Math.max(...boxes.map((box) => box.y + box.h / 2)) + 160;
    const chartW = Math.max(1, maxX - minX);
    const chartH = Math.max(1, maxY - minY);
    const nextZoom = clamp(
      Math.min(viewportSize.w / chartW, viewportSize.h / chartH),
      MIN_ZOOM,
      1.35,
    );
    focusWorldPoint({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, nextZoom);
  }, [displayPlacements, focusWorldPoint, viewportSize.h, viewportSize.w]);

  useEffect(() => {
    const handleNativeWheel = (event: WheelEvent) => {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node) || !root.contains(event.target)) return;
      event.preventDefault();
      zoomAtClientPoint(event.clientX, event.clientY, event.deltaY);
    };
    const preventBrowserGesture = (event: Event) => event.preventDefault();

    window.addEventListener("wheel", handleNativeWheel, { passive: false, capture: true });
    document.addEventListener("gesturestart", preventBrowserGesture, { passive: false });
    document.addEventListener("gesturechange", preventBrowserGesture, { passive: false });
    document.addEventListener("gestureend", preventBrowserGesture, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleNativeWheel, { capture: true });
      document.removeEventListener("gesturestart", preventBrowserGesture);
      document.removeEventListener("gesturechange", preventBrowserGesture);
      document.removeEventListener("gestureend", preventBrowserGesture);
    };
  }, [zoomAtClientPoint]);

  useEffect(() => {
    const handleKeyZoom = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(1.16);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomBy(0.86);
      } else if (event.key === "0") {
        event.preventDefault();
        fitChart();
      }
    };

    window.addEventListener("keydown", handleKeyZoom, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyZoom, { capture: true });
  }, [fitChart, zoomBy]);

  const clearCanvasSelection = () => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }
    setFocusedId(null);
    setCenterActive(false);
    focusWorldPoint({ x: 0, y: 0 }, viewRef.current.zoom, true);
  };

  const handleCanvasClick = () => {
    clearCanvasSelection();
  };

  const focusedIdea = focusedId ? state.ideas.find((idea) => idea.id === focusedId) : undefined;
  const focusedChildren = focusedId
    ? state.ideas.filter((idea) => idea.parentId === focusedId)
    : [];
  const { totalIdeaCount, searchResults } = useBrainstormSearch(library, searchQuery);

  const shareCurrentBrainstorm = async () => {
    if (typeof window === "undefined") return;
    const token = encodeBrainstormShare(state);
    const url = `${window.location.origin}${window.location.pathname}?brainstorm=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showNotice("Share link copied");
    } catch {
      window.prompt("Copy share link", url);
      showNotice("Share link ready");
    }
  };

  const updateFocusedIdea = (update: (idea: Idea) => Idea) => {
    if (!focusedId) return;
    setState((current) => ({
      ...current,
      ideas: current.ideas.map((idea) => (idea.id === focusedId ? update(idea) : idea)),
    }));
  };

  const plannerTargetLabel: Record<PlannerTarget, string> = {
    mit: "MIT",
    should: "Shoulds",
    could: "Coulds",
  };

  const sendFocusedToPlanner = async (target: PlannerTarget) => {
    if (!focusedIdea) return;
    const planner = await loadState();
    const childItems = childIdeasToTaskItems(focusedChildren);
    const result = createPlannerSendUpdate({
      planner,
      idea: focusedIdea,
      childItems,
      target,
    });

    if (result.status === "needs-mit-confirmation") {
      setPendingMitOverwrite({
        idea: { ...focusedIdea },
        childItems,
        existingMitText: result.existingMitText,
      });
      return;
    }

    if (result.status === "duplicate") {
      showNotice(`Already sent to ${plannerTargetLabel[target]}`);
      return;
    }

    await saveState(result.planner);
    showNotice(`Sent to ${plannerTargetLabel[target]}`);
  };

  const confirmMitOverwrite = async () => {
    if (!pendingMitOverwrite) return;

    const planner = await loadState();
    const result = createPlannerSendUpdate({
      planner,
      idea: pendingMitOverwrite.idea,
      childItems: pendingMitOverwrite.childItems,
      target: "mit",
      confirmMitOverwrite: true,
    });

    setPendingMitOverwrite(null);

    if (result.status === "sent") {
      await saveState(result.planner);
      showNotice("Sent to MIT");
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative h-screen w-screen overflow-hidden"
      style={{
        fontFamily: theme.fontFamily,
        background:
          shape === "blob"
            ? `radial-gradient(circle at 28% 18%, ${sketchPalette.paperAccent}, transparent 24%), radial-gradient(circle at 74% 76%, ${sketchPalette.markerGlow}, transparent 22%), ${sketchPalette.paper}`
            : undefined,
        color: shape === "blob" ? sketchPalette.ink : undefined,
      }}
    >
      {shape === "blob" ? (
        <SketchDoodles palette={sketchPalette} />
      ) : (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--could)] opacity-45 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 -right-24 h-80 w-80 rounded-full bg-[color:var(--mit)] opacity-42 blur-3xl"
          />
        </>
      )}

      <BrainstormTopBar
        library={library}
        totalIdeaCount={totalIdeaCount}
        searchResults={searchResults}
        searchQuery={searchQuery}
        libraryOpen={libraryOpen}
        searchOpen={searchOpen}
        shape={shape}
        theme={theme}
        sketchPalette={sketchPalette}
        onSearchQueryChange={setSearchQuery}
        onLibraryOpenChange={setLibraryOpen}
        onSearchOpenChange={setSearchOpen}
        onCreateBrainstorm={createNewBrainstorm}
        onDuplicateBrainstorm={duplicateBrainstorm}
        onDeleteBrainstorm={deleteActiveBrainstorm}
        onActivateBrainstorm={activateBrainstorm}
        onFocusSearchResult={(brainstormId, ideaId) => {
          activateBrainstorm(brainstormId);
          if (ideaId) setFocusedId(ideaId);
        }}
        onShareBrainstorm={() => void shareCurrentBrainstorm()}
        onOpenReset={() => setConfirmOpen(true)}
      />

      <NoticeToast notice={notice} shape={shape} theme={theme} sketchPalette={sketchPalette} />

      <div
        ref={viewportRef}
        className={cn(
          "absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing",
          interactionRef.current?.type === "node" && "cursor-default",
        )}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
        onClick={handleCanvasClick}
      >
        <ConnectorLayer
          ideas={state.ideas}
          placements={displayPlacements}
          depthById={depthById}
          viewportSize={viewportSize}
          view={view}
          shape={shape}
          theme={theme}
          sketchPalette={sketchPalette}
          focusedId={focusedId}
          lastAddedId={lastAddedId}
        />

        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{
            width: 0,
            height: 0,
            overflow: "visible",
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <TitleNode
            title={state.title}
            shape={shape}
            theme={theme}
            sketchPalette={sketchPalette}
            centerActive={centerActive}
            onActivate={() => {
              setFocusedId(null);
              setCenterActive(true);
            }}
            onTitleChange={(title) =>
              setState((current) => ({
                ...current,
                title,
              }))
            }
            onShapeChange={(nextShape) =>
              setState((current) => ({
                ...current,
                shape: nextShape,
              }))
            }
          />
          <NodesLayer
            ideas={state.ideas}
            placements={displayPlacements}
            depthById={depthById}
            shape={shape}
            theme={theme}
            sketchPalette={sketchPalette}
            lastAddedId={lastAddedId}
            focusedId={focusedId}
            editingId={editingId}
            draggingId={dragLive?.id}
            ignoreNextNodeClickRef={ignoreNextNodeClickRef}
            onRemoveIdea={removeIdea}
            onSelectIdea={(id) => selectIdea(id, { center: true })}
            onStartEdit={setEditingId}
            onCommitEdit={commitEdit}
            onStartDrag={handleNodePointerDown}
          />{" "}
        </div>
      </div>

      <OverviewMap
        placements={displayPlacements}
        ideas={state.ideas}
        viewportSize={viewportSize}
        view={view}
        viewportStroke={PAGE_THEME_VIEWPORT_STROKE[pageTheme] ?? "currentColor"}
        onFocusWorldPoint={(point) => focusWorldPoint(point)}
      />

      <ZoomControls
        shape={shape}
        theme={theme}
        sketchPalette={sketchPalette}
        onZoomIn={() => zoomBy(1.16)}
        onZoomOut={() => zoomBy(0.86)}
        onFit={fitChart}
      />

      <div
        className="absolute bottom-6 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-5"
        onClick={(event) => event.stopPropagation()}
      >
        <AnimatePresence>
          {focusedIdea && (
            <NodeActionBar
              focusedIdea={focusedIdea}
              shape={shape}
              theme={theme}
              sketchPalette={sketchPalette}
              onSendToPlanner={(target) => void sendFocusedToPlanner(target)}
              onUpdateIdea={updateFocusedIdea}
            />
          )}
        </AnimatePresence>
        <IdeaInputBar
          inputRef={inputRef}
          draft={draft}
          focusedId={focusedId}
          shape={shape}
          theme={theme}
          sketchPalette={sketchPalette}
          onDraftChange={setDraft}
          onSubmit={addIdea}
        />
      </div>

      <ResetDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setState(EMPTY);
          setFocusedId(null);
          setEditingId(null);
          setDragLive(null);
          setDraft("");
          setConfirmOpen(false);
          setPendingMitOverwrite(null);
          focusWorldPoint({ x: 0, y: 0 }, 1);
        }}
      />
      <MitOverwriteDialog
        open={pendingMitOverwrite !== null}
        existingText={pendingMitOverwrite?.existingMitText ?? ""}
        replacementText={pendingMitOverwrite?.idea.text ?? ""}
        shape={shape}
        theme={theme}
        sketchPalette={sketchPalette}
        onCancel={() => setPendingMitOverwrite(null)}
        onConfirm={() => void confirmMitOverwrite()}
      />
    </div>
  );
}
