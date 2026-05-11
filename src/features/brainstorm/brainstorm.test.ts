import { describe, expect, it } from "vitest";
import { connectorPathFromPoints } from "./canvas";
import { CENTER_BOX } from "./constants";
import { computeDepthMap } from "./graph";
import {
  EMPTY_BRAINSTORM_HISTORY,
  recordBrainstormHistory,
  redoBrainstormHistory,
  undoBrainstormHistory,
} from "./history";
import { layoutIdeas } from "./layout";
import { buildTodayBrainstorm, toMitHtml } from "./plannerImport";
import { createPlannerSendUpdate } from "./plannerBridge";
import { searchBrainstorms } from "./search";
import { decodeBrainstormShare, encodeBrainstormShare } from "./sharing";
import {
  nextAvailableBrainstormTitle,
  normalizeBrainstormLibrary,
  normalizeBrainstormState,
} from "./storage";
import type { BrainstormLibrary, BrainstormState, Idea } from "./types";

describe("brainstorm domain", () => {
  it("normalizes legacy and invalid brainstorm state safely", () => {
    const state = normalizeBrainstormState({
      version: 3,
      title: "A very long title that should be clipped before it turns into a paragraph",
      shape: "hex",
      ideas: [
        { id: "a", text: "A", parentId: "missing", kind: "task", done: true, collapsed: true },
        { id: "a", text: "duplicate" },
        { id: "b", text: "B", parentId: "a", kind: "unknown" },
      ],
    });

    expect(state.shape).toBe("blob");
    expect(state.title.length).toBeLessThanOrEqual(64);
    expect(state.ideas).toEqual([
      { id: "a", text: "A", parentId: undefined, kind: "task", done: true, collapsed: true },
      { id: "b", text: "B", parentId: "a", kind: undefined, done: false, collapsed: false },
    ]);
  });

  it("normalizes empty libraries into a usable active document", () => {
    const library = normalizeBrainstormLibrary({ brainstorms: [] });

    expect(library.version).toBe(4);
    expect(library.activeId).toBe(library.brainstorms[0].id);
    expect(library.brainstorms[0].shape).toBe("blob");
  });

  it("creates numbered default brainstorm titles when the name already exists", () => {
    expect(nextAvailableBrainstormTitle("Options", ["Options"])).toBe("Options 2");
    expect(nextAvailableBrainstormTitle("Options", ["options", "Options 2"])).toBe("Options 3");
    expect(nextAvailableBrainstormTitle("Focus", ["Options"])).toBe("Focus");
  });

  it("round-trips share links through the stable versioned state shape", () => {
    const state: BrainstormState = {
      version: 3,
      title: "Options",
      shape: "boxy",
      ideas: [{ id: "a", text: "Idea" }],
    };

    expect(decodeBrainstormShare(encodeBrainstormShare(state))).toEqual({
      ...state,
      ideas: [
        {
          id: "a",
          text: "Idea",
          cx: undefined,
          cy: undefined,
          parentId: undefined,
          kind: undefined,
          done: false,
          collapsed: false,
        },
      ],
    });
  });

  it("computes graph depth and keeps cycles from recursing forever", () => {
    const ideas: Idea[] = [
      { id: "a", text: "A" },
      { id: "b", text: "B", parentId: "a" },
      { id: "c", text: "C", parentId: "b" },
      { id: "loop", text: "Loop", parentId: "loop" },
    ];

    const depth = computeDepthMap(ideas);

    expect(depth.get("a")).toBe(0);
    expect(depth.get("b")).toBe(1);
    expect(depth.get("c")).toBe(2);
    expect(depth.get("loop")).toBe(1);
  });

  it("places child ideas away from their parent by default", () => {
    const placements = layoutIdeas(
      [
        { id: "a", text: "A" },
        { id: "b", text: "B", parentId: "a" },
      ],
      "blob",
    );

    expect(placements[0]).not.toEqual(CENTER_BOX);
    expect(
      Math.hypot(placements[1].x - placements[0].x, placements[1].y - placements[0].y),
    ).toBeGreaterThan(120);
  });

  it("generates distinct connector path modes", () => {
    const start = { x: 0, y: 0 };
    const end = { x: 100, y: 80 };

    expect(connectorPathFromPoints(start, end, "curve", 0)).toContain("Q");
    expect(connectorPathFromPoints(start, end, "orthogonal", 0)).toContain("H");
    expect(connectorPathFromPoints(start, end, "sketch", 0)).toContain("C");
  });

  it("records undo and redo history without mutating saved snapshots", () => {
    const before: BrainstormState = {
      version: 3,
      title: "Options",
      shape: "blob",
      ideas: [],
    };
    const after: BrainstormState = {
      ...before,
      ideas: [{ id: "a", text: "Idea" }],
    };

    const history = recordBrainstormHistory(EMPTY_BRAINSTORM_HISTORY, before, after);
    before.title = "Mutated after snapshot";
    after.ideas[0].text = "Changed after snapshot";

    const undone = undoBrainstormHistory(history, after);
    expect(undone.state).toEqual({
      version: 3,
      title: "Options",
      shape: "blob",
      ideas: [],
    });

    const redone = redoBrainstormHistory(undone.history, before);
    expect(redone.state?.ideas).toEqual([{ id: "a", text: "Changed after snapshot" }]);
  });

  it("maps today planner data into a nested brainstorm", () => {
    const today = buildTodayBrainstorm({
      mit: toMitHtml("Write plan"),
      mitDone: false,
      mitSubs: [{ text: "Draft", done: false }],
      shoulds: [{ text: "Email", done: false }],
      coulds: [{ text: "Walk", done: false }],
    });

    expect(today.title).toBe("Today");
    expect(today.shape).toBe("blob");
    expect(today.ideas.map((idea) => idea.text)).toEqual([
      "MIT",
      "Write plan",
      "Draft",
      "Shoulds",
      "Email",
      "Coulds",
      "Walk",
    ]);
  });

  it("searches titles and ideas across multiple brainstorms", () => {
    const library: BrainstormLibrary = {
      version: 4,
      activeId: "one",
      brainstorms: [
        { version: 3, id: "one", updatedAt: 1, title: "Work", shape: "blob", ideas: [] },
        {
          version: 3,
          id: "two",
          updatedAt: 2,
          title: "Home",
          shape: "pill",
          ideas: [{ id: "idea", text: "Buy milk" }],
        },
      ],
    };

    expect(searchBrainstorms(library, "milk")).toEqual([
      { brainstormId: "two", ideaId: "idea", label: "Buy milk", context: "Home" },
    ]);
  });

  it("requires confirmation before replacing an existing MIT", () => {
    const result = createPlannerSendUpdate({
      planner: {
        mit: toMitHtml("Existing MIT"),
        mitDone: false,
        mitSubs: [],
        shoulds: [],
        coulds: [],
      },
      idea: { id: "idea", text: "New MIT" },
      childItems: [],
      target: "mit",
    });

    expect(result).toEqual({
      status: "needs-mit-confirmation",
      existingMitText: "Existing MIT",
    });
  });

  it("does not duplicate brainstorm ideas in shoulds or coulds", () => {
    const result = createPlannerSendUpdate({
      planner: {
        mit: "",
        mitDone: false,
        mitSubs: [],
        shoulds: [{ text: "Send invoice", done: false }],
        coulds: [],
      },
      idea: { id: "idea", text: "  send   invoice " },
      childItems: [],
      target: "should",
    });

    expect(result).toEqual({ status: "duplicate" });
  });
});
