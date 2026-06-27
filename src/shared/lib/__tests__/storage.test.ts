import { describe, it, expect, beforeEach } from "vitest";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "@/shared/lib/storage";

// The storage functions prepend "jobmatch-" to all keys
const TEST_KEY = "test-key";
const PREFIXED_KEY = "jobmatch-test-key";

beforeEach(() => {
  localStorage.clear();
});

describe("setStorageItem", () => {
  it("stores a value with the jobmatch- prefix", () => {
    setStorageItem(TEST_KEY, { name: "test" });
    const raw = localStorage.getItem(PREFIXED_KEY);
    expect(raw).toBe('{"name":"test"}');
  });

  it("stores primitive values", () => {
    setStorageItem(TEST_KEY, "hello");
    expect(localStorage.getItem(PREFIXED_KEY)).toBe('"hello"');
  });

  it("stores arrays", () => {
    setStorageItem(TEST_KEY, [1, 2, 3]);
    expect(localStorage.getItem(PREFIXED_KEY)).toBe("[1,2,3]");
  });

  it("stores null as 'null' JSON string", () => {
    setStorageItem(TEST_KEY, null);
    expect(localStorage.getItem(PREFIXED_KEY)).toBe("null");
  });
});

describe("getStorageItem", () => {
  it("retrieves a stored value", () => {
    localStorage.setItem(PREFIXED_KEY, '{"name":"test"}');
    const result = getStorageItem<{ name: string }>(TEST_KEY);
    expect(result).toEqual({ name: "test" });
  });

  it("returns null for missing key", () => {
    const result = getStorageItem("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when localStorage is empty", () => {
    expect(getStorageItem(TEST_KEY)).toBeNull();
  });

  it("handles malformed JSON gracefully", () => {
    localStorage.setItem(PREFIXED_KEY, "not-json{");
    const result = getStorageItem(TEST_KEY);
    expect(result).toBeNull();
  });

  it("retrieves an array value", () => {
    localStorage.setItem(PREFIXED_KEY, "[1,2,3]");
    const result = getStorageItem<number[]>(TEST_KEY);
    expect(result).toEqual([1, 2, 3]);
  });

  it("retrieves primitive string value", () => {
    localStorage.setItem(PREFIXED_KEY, '"hello"');
    const result = getStorageItem<string>(TEST_KEY);
    expect(result).toBe("hello");
  });
});

describe("removeStorageItem", () => {
  it("removes a stored value", () => {
    localStorage.setItem(PREFIXED_KEY, "data");
    removeStorageItem(TEST_KEY);
    expect(localStorage.getItem(PREFIXED_KEY)).toBeNull();
  });

  it("does not throw when removing a non-existent key", () => {
    expect(() => removeStorageItem("nonexistent")).not.toThrow();
  });
});
