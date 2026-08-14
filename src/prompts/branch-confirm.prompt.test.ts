import { beforeEach, describe, expect, it, vi } from "vitest";
import { parse } from "valibot";
import { BranchState, Config } from "../valibot-state";

/**
 * POSIX single-quote shell escaping: wrap the value in single quotes and
 * replace every embedded `'` with the `'\''` close-escape-reopen sequence.
 * Matches the escaping applied to every known token value before
 * substitution, producing a single self-quoting shell argument.
 */
const sq = (value: string): string => `'${value.replaceAll("'", `'\\''`)}'`;

const mocked = vi.hoisted(() => ({
  dry_run: true,
  execSync: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock("child_process", () => ({
  execSync: mocked.execSync,
}));

vi.mock("@clack/prompts", () => ({
  log: {
    info: mocked.info,
    warning: vi.fn(),
    error: mocked.error,
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
    mocked.error.mockReset();
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

  it("renders hook templates for selected pre/post commands during dry run", async () => {
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {
      worktrees: {
        base_path: "../worktrees",
      },
      branch_pre_commands: ["echo pre {{TICKET}}"],
      branch_post_commands: ["echo post {{TYPE}}/{{TICKET}}"],
      worktree_pre_commands: ["echo worktree-pre {{TICKET}}"],
      worktree_post_commands: ["echo worktree-post {{SCOPE}}"],
    });
    const branch_state = parse(BranchState, {
      type: "feat",
      scope: "cli",
      ticket: "TAC-123",
      description: "add-parser",
      checkout: "branch",
    });

    mocked.execSync.mockImplementation((command: string) => {
      if (command.includes("show-ref")) throw new Error("branch missing");
      return Buffer.from("");
    });

    await new BranchConfirmPrompt(config, branch_state, {} as never).run();

    // Only the show-ref check runs a real command; everything else is dry-run logged.
    expect(mocked.execSync).toHaveBeenCalledTimes(1);
    expect(mocked.info).toHaveBeenCalledWith(
      `Dry run: echo pre ${sq("TAC-123")}`,
    );
    expect(mocked.info).toHaveBeenCalledWith(
      "Dry run: git  checkout -b feat/TAC-123-cli-add-parser",
    );
    expect(mocked.info).toHaveBeenCalledWith(
      `Dry run: echo post ${sq("feat")}/${sq("TAC-123")}`,
    );

    // branch checkout (not worktree), so worktree hooks are not selected/rendered
    expect(mocked.info).not.toHaveBeenCalledWith(
      expect.stringContaining("worktree-pre"),
    );
    expect(mocked.info).not.toHaveBeenCalledWith(
      expect.stringContaining("worktree-post"),
    );

    // pre logged before checkout, checkout before post
    const pre_index = mocked.info.mock.calls.findIndex((call) =>
      String(call[0]).includes("echo pre"),
    );
    const checkout_index = mocked.info.mock.calls.findIndex((call) =>
      String(call[0]).includes("checkout -b"),
    );
    const post_index = mocked.info.mock.calls.findIndex((call) =>
      String(call[0]).includes("echo post"),
    );
    expect(pre_index).toBeLessThan(checkout_index);
    expect(checkout_index).toBeLessThan(post_index);
  });

  it("renders worktree hook templates, including empty values, when checkout is worktree", async () => {
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {
      worktrees: {
        base_path: "../worktrees",
      },
      worktree_pre_commands: ["echo worktree-pre {{TICKET}}"],
      worktree_post_commands: ["echo worktree-post [{{SCOPE}}]"],
    });
    const branch_state = parse(BranchState, {
      type: "feat",
      ticket: "TAC-123",
      description: "add-parser",
      checkout: "worktree",
    });

    mocked.execSync.mockImplementation((command: string) => {
      if (command.includes("show-ref")) throw new Error("branch missing");
      return Buffer.from("");
    });

    await new BranchConfirmPrompt(config, branch_state, {} as never).run();

    expect(mocked.info).toHaveBeenCalledWith(
      `Dry run: echo worktree-pre ${sq("TAC-123")}`,
    );
    // scope was never set, so the template renders to a quoted empty string
    expect(mocked.info).toHaveBeenCalledWith(
      `Dry run: echo worktree-post [${sq("")}]`,
    );
  });

  it("escapes shell metacharacters and embedded quotes in worktree hook values", async () => {
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {
      worktrees: {
        base_path: "../worktrees",
      },
      worktree_pre_commands: ["echo worktree-pre {{TICKET}}"],
    });
    const malicious = "AVF-123'; rm -rf / && echo pwned";
    const branch_state = parse(BranchState, {
      type: "feat",
      ticket: malicious,
      description: "add-parser",
      checkout: "worktree",
    });

    mocked.execSync.mockImplementation((command: string) => {
      if (command.includes("show-ref")) throw new Error("branch missing");
      return Buffer.from("");
    });

    await new BranchConfirmPrompt(config, branch_state, {} as never).run();

    expect(mocked.info).toHaveBeenCalledWith(
      `Dry run: echo worktree-pre ${sq(malicious)}`,
    );
  });

  it("executes rendered commands in order and rejects with the underlying error on failure", async () => {
    mocked.dry_run = false;
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {
      worktrees: {
        base_path: "../worktrees",
      },
      branch_pre_commands: ["runScript({{TICKET}})"],
      branch_post_commands: ["echo post {{TICKET}}"],
    });
    const branch_state = parse(BranchState, {
      type: "feat",
      ticket: "TAC-123",
      description: "add-parser",
      checkout: "branch",
    });

    mocked.execSync.mockImplementation((command: string) => {
      if (command.includes("show-ref")) throw new Error("branch missing");
      if (command.includes("runScript")) throw new Error("boom");
      return Buffer.from("");
    });

    await expect(
      new BranchConfirmPrompt(config, branch_state, {} as never).run(),
    ).rejects.toThrow("boom");

    // pre-command failed, so checkout and post-commands must never run
    expect(mocked.execSync).toHaveBeenCalledWith(
      `runScript(${sq("TAC-123")})`,
      {
        stdio: "inherit",
      },
    );
    expect(mocked.execSync).not.toHaveBeenCalledWith(
      expect.stringContaining("checkout"),
      expect.anything(),
    );
    expect(mocked.execSync).not.toHaveBeenCalledWith(
      `echo post ${sq("TAC-123")}`,
      {
        stdio: "inherit",
      },
    );
    expect(mocked.error).toHaveBeenCalledWith(
      expect.stringContaining(
        `Something went wrong when executing pre-commands: runScript(${sq("TAC-123")})`,
      ),
    );
  });

  it("leaves an unknown template literal and still runs hooks without throwing", async () => {
    mocked.dry_run = false;
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {
      worktrees: {
        base_path: "../worktrees",
      },
      branch_pre_commands: ["runScript({{TIKCET}})"],
    });
    const branch_state = parse(BranchState, {
      type: "feat",
      ticket: "TAC-123",
      description: "add-parser",
      checkout: "branch",
    });

    mocked.execSync.mockImplementation((command: string) => {
      if (command.includes("show-ref")) throw new Error("branch missing");
      return Buffer.from("");
    });

    await expect(
      new BranchConfirmPrompt(config, branch_state, {} as never).run(),
    ).resolves.toBeUndefined();

    // Unknown token is not an exact known form, so it stays untouched.
    expect(mocked.execSync).toHaveBeenCalledWith("runScript({{TIKCET}})", {
      stdio: "inherit",
    });
  });

  it("leaves a lowercase or whitespace-padded token literal instead of throwing", async () => {
    mocked.dry_run = false;
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {
      worktrees: {
        base_path: "../worktrees",
      },
      branch_pre_commands: ["echo {{ticket}} {{ TICKET }}"],
    });
    const branch_state = parse(BranchState, {
      type: "feat",
      ticket: "TAC-123",
      description: "add-parser",
      checkout: "branch",
    });

    mocked.execSync.mockImplementation((command: string) => {
      if (command.includes("show-ref")) throw new Error("branch missing");
      return Buffer.from("");
    });

    await new BranchConfirmPrompt(config, branch_state, {} as never).run();

    expect(mocked.execSync).toHaveBeenCalledWith(
      "echo {{ticket}} {{ TICKET }}",
      { stdio: "inherit" },
    );
  });
});
