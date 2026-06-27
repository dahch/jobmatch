import { describe, it, expect } from "vitest";
import { cn, generateId, formatDate } from "@/shared/lib/utils";

describe("cn", () => {
  it("merges and deduplicates tailwind classes", () => {
    const result = cn("px-4 py-2", "px-4", "bg-red-500");
    expect(result).toContain("py-2");
    expect(result).toContain("bg-red-500");
    // px-4 should appear only once due to twMerge
    const px4matches = result.match(/px-4/g);
    expect(px4matches?.length || 0).toBe(1);
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", undefined, null, "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles single class", () => {
    expect(cn("single")).toBe("single");
  });
});

describe("generateId", () => {
  it("returns a non-empty string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns unique IDs on each call", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("returns a valid UUID format", () => {
    const id = generateId();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(id)).toBe(true);
  });
});

describe("formatDate", () => {
  it("formats ISO date string to Mon YYYY", () => {
    // Use a fixed date to avoid locale issues
    const result = formatDate("2024-03-15");
    expect(result).toMatch(/Mar 2024/);
  });

  it("handles full ISO timestamp", () => {
    const result = formatDate("2023-01-01T00:00:00Z");
    expect(result).toMatch(/Jan 2023/);
  });

  it("handles different months correctly", () => {
    expect(formatDate("2024-06-15")).toMatch(/Jun 2024/);
    expect(formatDate("2024-12-01")).toMatch(/Dec 2024/);
  });
});
