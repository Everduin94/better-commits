import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  writeFileSync: vi.fn<typeof fs.writeFileSync>(),
  intro: vi.fn(),
  outro: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
  success: vi.fn(),
  error: vi.fn(),
  get_git_root: vi.fn(() => "/repo"),
  get_repository_config_path: vi.fn<() => string | null>(),
}));

vi.mock("fs", () => ({
  default: {
    writeFileSync: mocked.writeFileSync,
  },
}));

vi.mock("@clack/prompts", () => ({
  intro: mocked.intro,
  outro: mocked.outro,
  confirm: mocked.confirm,
  isCancel: mocked.isCancel,
  log: {
    success: mocked.success,
    error: mocked.error,
  },
}));

vi.mock("./utils", async () => {
  const actual = await vi.importActual<typeof import("./utils")>("./utils");
  return {
    ...actual,
    get_git_root: mocked.get_git_root,
    get_repository_config_path: mocked.get_repository_config_path,
  };
});

describe("create_init_config", () => {
  beforeEach(() => {
    vi.resetModules();
    mocked.writeFileSync.mockReset();
    mocked.intro.mockReset();
    mocked.outro.mockReset();
    mocked.confirm.mockReset();
    mocked.isCancel.mockReset();
    mocked.isCancel.mockReturnValue(false);
    mocked.success.mockReset();
    mocked.error.mockReset();
    mocked.get_git_root.mockReset();
    mocked.get_git_root.mockReturnValue("/repo");
    mocked.get_repository_config_path.mockReset();
  });

  it("creates a new config when none exists", async () => {
    mocked.get_repository_config_path.mockReturnValue(null);

    const { create_init_config } = await import("./init");
    mocked.writeFileSync.mockClear();
    mocked.confirm.mockClear();
    mocked.outro.mockClear();

    await create_init_config();

    expect(mocked.confirm).not.toHaveBeenCalled();
    expect(mocked.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it("asks before overwriting an existing config", async () => {
    mocked.get_repository_config_path.mockReturnValue("/repo/.better-commits.jsonc");
    mocked.confirm.mockResolvedValue(true);

    const { create_init_config } = await import("./init");
    mocked.writeFileSync.mockClear();
    mocked.confirm.mockClear();
    mocked.outro.mockClear();

    await create_init_config();

    expect(mocked.confirm).toHaveBeenCalledTimes(1);
    expect(mocked.writeFileSync).toHaveBeenCalledWith(
      "/repo/.better-commits.jsonc",
      expect.any(String),
    );
  });

  it("writes the canonical jsonc file when a legacy json config exists", async () => {
    mocked.get_repository_config_path.mockReturnValue("/repo/.better-commits.json");
    mocked.confirm.mockResolvedValue(true);

    const { create_init_config } = await import("./init");
    mocked.writeFileSync.mockClear();
    mocked.confirm.mockClear();
    mocked.outro.mockClear();

    await create_init_config();

    expect(mocked.confirm).toHaveBeenCalledTimes(1);
    expect(mocked.writeFileSync).toHaveBeenCalledWith(
      "/repo/.better-commits.jsonc",
      expect.any(String),
    );
  });

  it("does not overwrite when confirmation is declined", async () => {
    mocked.get_repository_config_path.mockReturnValue("/repo/.better-commits.jsonc");
    mocked.confirm.mockResolvedValue(false);

    const { create_init_config } = await import("./init");
    mocked.writeFileSync.mockClear();
    mocked.confirm.mockClear();
    mocked.outro.mockClear();

    await create_init_config();

    expect(mocked.confirm).toHaveBeenCalledTimes(1);
    expect(mocked.writeFileSync).not.toHaveBeenCalled();
    expect(mocked.outro).toHaveBeenCalledWith("Cancelled");
  });
});
