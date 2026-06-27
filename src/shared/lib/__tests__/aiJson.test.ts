import { describe, it, expect } from "vitest";
import {
  normalizeModality,
  toStringArray,
  repairTruncatedJSON,
  parseAIJsonResponse,
} from "@/shared/lib/aiJson";

describe("normalizeModality", () => {
  it("normalizes common values", () => {
    expect(normalizeModality("remote")).toBe("Remote");
    expect(normalizeModality("Remote")).toBe("Remote");
    expect(normalizeModality("hybrid")).toBe("Hybrid");
    expect(normalizeModality("on-site")).toBe("On-site");
    expect(normalizeModality("onsite")).toBe("On-site");
  });

  it("returns Unknown for unrecognized values", () => {
    expect(normalizeModality("")).toBe("Unknown");
    expect(normalizeModality(null)).toBe("Unknown");
    expect(normalizeModality(undefined)).toBe("Unknown");
    expect(normalizeModality("something")).toBe("Unknown");
  });
});

describe("toStringArray", () => {
  it("converts arrays to string arrays", () => {
    expect(toStringArray(["a", "b"])).toEqual(["a", "b"]);
    expect(toStringArray([1, 2, 3])).toEqual(["1", "2", "3"]);
  });

  it("returns empty array for non-arrays", () => {
    expect(toStringArray(null)).toEqual([]);
    expect(toStringArray(undefined)).toEqual([]);
    expect(toStringArray("string")).toEqual([]);
    expect(toStringArray(42)).toEqual([]);
  });
});

describe("repairTruncatedJSON", () => {
  it("closes unclosed braces", () => {
    const input = '{"jobs":[{"title":"test"}';
    const result = repairTruncatedJSON(input);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("closes unclosed brackets", () => {
    const input = '{"jobs":[{"title":"test"}]}';
    const result = repairTruncatedJSON(input);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("removes trailing commas", () => {
    const input = '{"jobs":[{"title":"test",},]}';
    const result = repairTruncatedJSON(input);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("strips markdown fences", () => {
    const input = '```json\n{"jobs":[{"title":"test"}]}\n```';
    const result = repairTruncatedJSON(input);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("removes repeated token corruption", () => {
    const input =
      '{"jobs":[{"title":"test"}],"company","company","company","company","company"}';
    const result = repairTruncatedJSON(input);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});

describe("parseAIJsonResponse", () => {
  it("parses valid JSON directly", () => {
    const input = '{"jobs":[{"title":"test"}]}';
    const result = parseAIJsonResponse(input);
    expect(result).toEqual({ jobs: [{ title: "test" }] });
  });

  it("extracts JSON from markdown code block", () => {
    const input = '```json\n{"jobs":[{"title":"test"}]}\n```';
    const result = parseAIJsonResponse(input);
    expect(result).toEqual({ jobs: [{ title: "test" }] });
  });

  it("extracts raw JSON from mixed content", () => {
    const input = 'Here are the results:\n{"jobs":[{"title":"test"}]}\nDone.';
    const result = parseAIJsonResponse(input);
    expect(result).toEqual({ jobs: [{ title: "test" }] });
  });

  it("throws on unparseable content", () => {
    expect(() => parseAIJsonResponse("no json here")).toThrow();
  });
});
