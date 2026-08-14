import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  readFileSync: vi.fn<typeof fs.readFileSync>(),
  writeFileSync: vi.fn<typeof fs.writeFileSync>(),
  mkdirSync: vi.fn<typeof fs.mkdirSync>(),
}));

vi.mock("fs", () => ({
  default: {
    readFileSync: mocked.readFileSync,
    writeFileSync: mocked.writeFileSync,
    mkdirSync: mocked.mkdirSync,
  },
}));

describe("FilePromptCache", () => {
  beforeEach(() => {
    mocked.readFileSync.mockReset();
    mocked.writeFileSync.mockReset();
    mocked.mkdirSync.mockReset();
  });

  it("returns the cached value for a key", async () => {
    mocked.readFileSync.mockReturnValue(JSON.stringify({ foo: "bar" }));

    const { FilePromptCache } = await import("./prompt-cache");
    const cache = new FilePromptCache();

    expect(cache.get("foo")).toBe("bar");
  });

  it("returns undefined and resets the cache file when JSON is not read", async () => {
    const error = new Error("no such file");
    (error as NodeJS.ErrnoException).code = "ENOENT";
    mocked.readFileSync.mockImplementation(() => {
      throw error;
    });

    const { FilePromptCache } = await import("./prompt-cache");
    const cache = new FilePromptCache();

    expect(cache.get("foo")).toBeUndefined();
    expect(mocked.writeFileSync).not.toHaveBeenCalled();
  });

  it("resets the cache when the file contains invalid JSON", async () => {
    mocked.readFileSync.mockReturnValue("not json");

    const { FilePromptCache } = await import("./prompt-cache");
    const cache = new FilePromptCache();

    expect(cache.get("foo")).toBeUndefined();
    expect(mocked.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({}, null, "\t"),
      { mode: 0o600 },
    );
  });

  it.each([["null", "null"], ["an array", "[1,2,3]"], ["a string", '"oops"'], ["a number", "42"]])(
    "resets the cache when the parsed JSON is %s",
    async (_label, raw) => {
      mocked.readFileSync.mockReturnValue(raw);

      const { FilePromptCache } = await import("./prompt-cache");
      const cache = new FilePromptCache();

      expect(cache.get("foo")).toBeUndefined();
      expect(mocked.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify({}, null, "\t"),
        { mode: 0o600 },
      );
    },
  );

  it("rethrows unexpected read errors", async () => {
    const error = new Error("permission denied");
    (error as NodeJS.ErrnoException).code = "EACCES";
    mocked.readFileSync.mockImplementation(() => {
      throw error;
    });

    const { FilePromptCache } = await import("./prompt-cache");
    const cache = new FilePromptCache();

    expect(() => cache.get("foo")).toThrow("permission denied");
  });
});
