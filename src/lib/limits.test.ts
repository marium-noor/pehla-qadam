import { describe, expect, it } from "vitest";
import { canUseVoice, consumeChat, isCheckinDue, karachiDay, type ChatUsage } from "./limits";

// 2026-11-21 10:00 UTC is 15:00 in Karachi.
const noon = Date.UTC(2026, 10, 21, 10, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

describe("karachiDay", () => {
  it("uses Pakistan time, not UTC", () => {
    // 20:00 UTC on the 21st is already 01:00 on the 22nd in Karachi.
    expect(karachiDay(Date.UTC(2026, 10, 21, 20, 0, 0))).toBe("2026-11-22");
    expect(karachiDay(Date.UTC(2026, 10, 21, 18, 59, 59))).toBe("2026-11-21");
    expect(karachiDay(Date.UTC(2026, 10, 21, 19, 0, 0))).toBe("2026-11-22");
  });
});

describe("free chat limit", () => {
  it("starts a new user at 1 used", () => {
    const d = consumeChat("free", { day: null, count: 0 }, noon);
    expect(d).toEqual({ allowed: true, usage: { day: "2026-11-21", count: 1 }, remaining: 9 });
  });

  it("allows the 10th message and blocks the 11th", () => {
    let usage: ChatUsage = { day: null, count: 0 };
    for (let i = 1; i <= 10; i++) {
      const d = consumeChat("free", usage, noon + i);
      expect(d.allowed).toBe(true);
      usage = d.usage;
    }
    expect(usage.count).toBe(10);
    const blocked = consumeChat("free", usage, noon + 99);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.usage).toEqual({ day: "2026-11-21", count: 10 }); // not incremented
  });

  it("resets when the Karachi day changes", () => {
    const full: ChatUsage = { day: "2026-11-21", count: 10 };
    const nextMorning = Date.UTC(2026, 10, 21, 19, 0, 0); // midnight in Karachi
    const d = consumeChat("free", full, nextMorning);
    expect(d.allowed).toBe(true);
    expect(d.usage).toEqual({ day: "2026-11-22", count: 1 });
  });

  it("does not reset at UTC midnight, only at Karachi midnight", () => {
    // 00:30 UTC on the 21st is 05:30 on the 21st in Karachi: still the same Karachi day.
    const full: ChatUsage = { day: "2026-11-21", count: 10 };
    expect(consumeChat("free", full, Date.UTC(2026, 10, 21, 0, 30, 0)).allowed).toBe(false);
  });

  it("treats a stale day from another date as a fresh day", () => {
    const d = consumeChat("free", { day: "2026-01-01", count: 10 }, noon);
    expect(d.allowed).toBe(true);
    expect(d.usage.count).toBe(1);
  });

  it("honours a custom limit", () => {
    expect(consumeChat("free", { day: "2026-11-21", count: 2 }, noon, 3).allowed).toBe(true);
    expect(consumeChat("free", { day: "2026-11-21", count: 3 }, noon, 3).allowed).toBe(false);
  });

  it("ignores a negative stored count", () => {
    const d = consumeChat("free", { day: "2026-11-21", count: -5 }, noon);
    expect(d.usage.count).toBe(1);
  });
});

describe("paid plans", () => {
  const full: ChatUsage = { day: "2026-11-21", count: 999 };
  it("plus is unlimited and never counted", () => {
    const d = consumeChat("plus", full, noon);
    expect(d).toEqual({ allowed: true, usage: full, remaining: null });
  });
  it("teams is unlimited and never counted", () => {
    expect(consumeChat("teams", full, noon).allowed).toBe(true);
  });
  it("only paid plans get voice", () => {
    expect(canUseVoice("free")).toBe(false);
    expect(canUseVoice("plus")).toBe(true);
    expect(canUseVoice("teams")).toBe(true);
  });
});

describe("monthly check-in", () => {
  it("is never due for free, even if never sent", () => {
    expect(isCheckinDue("free", null, noon)).toBe(false);
    expect(isCheckinDue("free", new Date(noon - 400 * DAY).toISOString(), noon)).toBe(false);
  });
  it("is due for a paid user who never had one", () => {
    expect(isCheckinDue("plus", null, noon)).toBe(true);
    expect(isCheckinDue("teams", null, noon)).toBe(true);
  });
  it("waits 30 days between sends", () => {
    expect(isCheckinDue("plus", new Date(noon - 29 * DAY).toISOString(), noon)).toBe(false);
    expect(isCheckinDue("plus", new Date(noon - 30 * DAY).toISOString(), noon)).toBe(true);
  });
});
