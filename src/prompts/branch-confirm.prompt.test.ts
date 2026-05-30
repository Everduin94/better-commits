import { beforeEach, describe, expect, it, vi } from "vitest";
import { parse } from "valibot";
import { BranchState, Config } from "../valibot-state";

const mocked = vi.hoisted(() => ({
  dry_run: true,
  execSync: vi.fn(),
  info: vi.fn(),
}));

vi.mock("child_process", () => ({
  execSync: mocked.execSync,
}));

vi.mock("@clack/prompts", () => ({
  log: {
    info: mocked.info,
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("picocolors", () => ({
  default: {
    bgGreen: (value: string) => value,
    bgMagenta: (value: string) => value,
    black: (value: string) => value,
    yellow: (value: string) => value,
  },
}));

vi.mock("../branch-args", () => ({
  branch_flags: {
    git_args: "",
    get dry_run() {
      return mocked.dry_run;
    },
  },
}));

vi.mock("../utils", async () => {
  const actual = await vi.importActual<typeof import("../utils")>("../utils");
  return {
    ...actual,
    get_git_root: vi.fn(() => "/tmp/repo"),
  };
});

describe("BranchConfirmPrompt", () => {
  beforeEach(() => {
    mocked.dry_run = true;
    mocked.execSync.mockReset();
    mocked.info.mockReset();
  });

  it("does not create a worktree during dry run", async () => {
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {
      worktrees: {
        base_path: "../worktrees",
      },
    });
    const branch_state = parse(BranchState, {
      type: "feat",
      scope: "cli",
      ticket: "TAC-123",
      description: "add-parser",
      checkout: "worktree",
    });

    mocked.execSync.mockImplementation((command: string) => {
      if (command.includes("show-ref")) throw new Error("branch missing");
      return Buffer.from("");
    });

    await new BranchConfirmPrompt(config, branch_state, {} as never).run();

    expect(mocked.execSync).toHaveBeenCalledTimes(1);
    expect(mocked.execSync).toHaveBeenCalledWith(
      "git  show-ref feat/TAC-123-cli-add-parser",
      {
        encoding: "utf-8",
      },
    );
    expect(mocked.info).toHaveBeenCalledWith(
      "Dry run: git  worktree add ../worktrees/repo-TAC-123-add-parser -b feat/TAC-123-cli-add-parser",
    );
  });
});
