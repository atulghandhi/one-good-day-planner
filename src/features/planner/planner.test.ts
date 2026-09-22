import { describe, expect, it } from "vitest";
import { orderTaskItems } from "./priority";
import { collectRolloverTasks, insertRolloverTask, pruneRolloverQueue } from "./rollover";
import { normalizePlannerState, startOfWeek, weekDates } from "./storage";
import { copyPlannerItemsToJot, normalizeJotItems } from "./jot";

describe("planner domain", () => {
  it("copies structured tasks to a flat jot list without changing the source", () => {
    const state = normalizePlannerState({
      mit: "<p>Ship the thing</p>",
      mitDone: true,
      shoulds: [{ text: "Reply", done: false, priority: "high" }],
      coulds: [{ text: "Walk", done: false }],
    });
    const before = structuredClone(state);

    expect(copyPlannerItemsToJot(state).map(({ text, done }) => ({ text, done }))).toEqual([
      { text: "Ship the thing", done: true },
      { text: "Reply", done: false },
      { text: "Walk", done: false },
    ]);
    expect(state).toEqual(before);
    expect(normalizeJotItems([])).toEqual([{ text: "", done: false }]);
  });
  it("normalizes legacy string task arrays and priority values", () => {
    expect(
      normalizePlannerState({
        mit: "<p>Win</p>",
        mitDone: 1,
        mitSubs: ["first", { text: "second", done: true, priority: "high" }],
        shoulds: [{ text: "pay bill", steps: ["open app", { text: "confirm", done: true }] }],
        coulds: [{ text: "walk", done: false, priority: "nope" }],
      }),
    ).toEqual({
      mit: "<p>Win</p>",
      mitDone: true,
      mitSubs: [
        { text: "first", done: false },
        { text: "second", done: true, priority: "high" },
      ],
      shoulds: [
        {
          text: "pay bill",
          done: false,
          priority: undefined,
          steps: [
            { text: "open app", done: false },
            { text: "confirm", done: true, priority: undefined },
          ],
        },
      ],
      coulds: [{ text: "walk", done: false, priority: undefined }],
    });
  });

  it("orders open tasks by priority while keeping completed tasks at the bottom", () => {
    const ordered = orderTaskItems([
      { text: "done", done: true, priority: "high" },
      { text: "low", done: false, priority: "low" },
      { text: "plain", done: false },
      { text: "high", done: false, priority: "high" },
      { text: "medium", done: false, priority: "medium" },
    ]);

    expect(ordered.map(({ item }) => item.text)).toEqual([
      "high",
      "medium",
      "low",
      "plain",
      "done",
    ]);
  });

  it("builds Monday-start week dates in local time", () => {
    const saturday = new Date(2026, 4, 9, 12);
    expect(startOfWeek(saturday)).toEqual(new Date(2026, 4, 4));
    expect(weekDates(saturday).map((date) => date.getDate())).toEqual([4, 5, 6, 7, 8, 9, 10]);
  });

  it("collects unfinished rollover tasks and keeps MIT steps numbered separately", () => {
    const tasks = collectRolloverTasks(
      {
        mit: "<p>Ship feature</p>",
        mitDone: false,
        mitSubs: [
          { text: "wire storage", done: true },
          { text: "test UI", done: false },
        ],
        shoulds: [
          { text: "reply", done: false, priority: "high" },
          { text: "done already", done: true },
        ],
        coulds: [{ text: "stretch", done: false }],
      },
      "2026-05-13",
      100,
    );

    expect(tasks.map((task) => [task.kind, task.text])).toEqual([
      ["mit", "Ship feature"],
      ["should", "reply"],
      ["could", "stretch"],
    ]);
    expect(tasks[0].steps.map((step) => step.text)).toEqual(["test UI"]);
  });

  it("moves an existing MIT into shoulds when a rollover MIT is restored", () => {
    const next = insertRolloverTask(
      {
        mit: "<p>Current MIT</p>",
        mitDone: false,
        mitSubs: [
          { text: "first", done: false },
          { text: "second", done: false },
        ],
        shoulds: [{ text: "", done: false }],
        coulds: [{ text: "", done: false }],
      },
      {
        id: "old-mit",
        date: "2026-05-13",
        kind: "mit",
        text: "Yesterday MIT",
        mitHtml: "<p>Yesterday MIT</p>",
        steps: [{ text: "old step", done: false }],
        createdAt: 1,
      },
    );

    expect(next.mit).toBe("<p>Yesterday MIT</p>");
    expect(next.mitSubs).toEqual([{ text: "old step", done: false }]);
    expect(next.shoulds[0].text).toBe("Current MIT\n- first\n- second");
  });

  it("prunes rollover tasks older than seven local days", () => {
    expect(
      pruneRolloverQueue(
        [
          { id: "old", date: "2026-05-06", kind: "should", text: "old", steps: [], createdAt: 1 },
          { id: "new", date: "2026-05-08", kind: "should", text: "new", steps: [], createdAt: 2 },
        ],
        "2026-05-14",
      ).map((task) => task.id),
    ).toEqual(["new"]);
  });
});
