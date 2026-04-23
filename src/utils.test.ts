import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  existsSync: vi.fn<typeof fs.existsSync>(),
  readFileSync: vi.fn<typeof fs.readFileSync>(),
  writeFileSync: vi.fn<typeof fs.writeFileSync>(),
  intro: vi.fn(),
  step: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    existsSync: mocked.existsSync,
    readFileSync: mocked.readFileSync,
    writeFileSync: mocked.writeFileSync,
  },
}));

vi.mock("@clack/prompts", () => ({
  intro: mocked.intro,
  log: {
    step: mocked.step,
    error: mocked.error,
    warn: mocked.warn,
  },
}));

vi.mock("./args", () => ({
  flags: {
    git_args: "",
  },
}));

vi.mock("child_process", () => ({
  execSync: vi.fn(() => Buffer.from("/repo")),
}));

describe("load_setup", () => {
  beforeEach(() => {
    vi.resetModules();
    mocked.existsSync.mockReset();
    mocked.readFileSync.mockReset();
    mocked.writeFileSync.mockReset();
    mocked.intro.mockReset();
    mocked.step.mockReset();
    mocked.error.mockReset();
    mocked.warn.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads a plain JSON repository config", async () => {
    const home = "/home/test";
    vi.stubEnv("HOME", home);
    mocked.existsSync.mockImplementation((file_path) =>
      [
        `${home}/.better-commits.json`,
        "/repo/.better-commits.json",
      ].includes(String(file_path)),
    );
    mocked.readFileSync.mockImplementation((file_path) => {
      if (String(file_path) === "/repo/.better-commits.json") {
        return JSON.stringify({ confirm_commit: false });
      }

      return JSON.stringify({ cache_last_value: false, overrides: {} });
    });

    const { load_setup } = await import("./utils");
    const result = load_setup();

    expect(result.config_source).toBe("repository");
    expect(result.config.confirm_commit).toBe(false);
  });

  it("loads a JSONC repository config with comments and trailing commas", async () => {
    const home = "/home/test";
    vi.stubEnv("HOME", home);
    mocked.existsSync.mockImplementation((file_path) =>
      [
        `${home}/.better-commits.jsonc`,
        "/repo/.better-commits.jsonc",
      ].includes(String(file_path)),
    );
    mocked.readFileSync.mockImplementation((file_path) => {
      if (String(file_path) === "/repo/.better-commits.jsonc") {
        return `{
          // repo config
          "confirm_commit": false,
          "commit_body": {
            "required": true,
          },
        }`;
      }

      return `{
        "cache_last_value": false,
        "overrides": {},
      }`;
    });

    const { load_setup } = await import("./utils");
    const result = load_setup();

    expect(result.config_source).toBe("repository");
    expect(result.config.confirm_commit).toBe(false);
    expect(result.config.commit_body.required).toBe(true);
  });

  it("prefers .jsonc over .json when both exist", async () => {
    const home = "/home/test";
    vi.stubEnv("HOME", home);
    mocked.existsSync.mockImplementation((file_path) =>
      [
        `${home}/.better-commits.jsonc`,
        "/repo/.better-commits.jsonc",
        "/repo/.better-commits.json",
      ].includes(String(file_path)),
    );
    mocked.readFileSync.mockImplementation((file_path) => {
      if (String(file_path) === "/repo/.better-commits.jsonc") {
        return `{
          "confirm_commit": false,
        }`;
      }

      if (String(file_path) === "/repo/.better-commits.json") {
        return JSON.stringify({ confirm_commit: true });
      }

      return `{
        "cache_last_value": false,
        "overrides": {},
      }`;
    });

    const { load_setup } = await import("./utils");
    const result = load_setup();

    expect(result.config.confirm_commit).toBe(false);
  });

  it("writes the JSONC template when no config exists", async () => {
    const home = "/home/test";
    vi.stubEnv("HOME", home);
    mocked.existsSync.mockReturnValue(false);

    const { load_setup, CONFIG_FILE_NAME } = await import("./utils");
    const { DEFAULT_CONFIG_TEMPLATE } = await import("./default-config-template");
    const result = load_setup();

    expect(result.config_source).toBe("none");
    expect(mocked.writeFileSync).toHaveBeenCalledWith(
      path.join(home, CONFIG_FILE_NAME),
      DEFAULT_CONFIG_TEMPLATE,
    );
  });
});
