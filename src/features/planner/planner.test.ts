import { describe, expect, it } from "vitest";
import { orderTaskItems } from "./priority";
import { normalizePlannerState, startOfWeek, weekDates } from "./storage";

describe("planner domain", () => {
  it("normalizes legacy string task arrays and priority values", () => {
    expect(
      normalizePlannerState({
        mit: "<p>Win</p>",
        mitDone: 1,
        mitSubs: ["first", { text: "second", done: true, priority: "high" }],
        shoulds: ["pay bill"],
        coulds: [{ text: "walk", done: false, priority: "nope" }],
      }),
    ).toEqual({
      mit: "<p>Win</p>",
      mitDone: true,
      mitSubs: [
        { text: "first", done: false },
        { text: "second", done: true, priority: "high" },
      ],
      shoulds: [{ text: "pay bill", done: false }],
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
});
