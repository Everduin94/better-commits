import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  git_options: [] as string[],
  execFileSync: vi.fn(),
  execSync: vi.fn(),
  spawnSync: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock("child_process", () => ({
  execFileSync: mocked.execFileSync,
  execSync: mocked.execSync,
  spawnSync: mocked.spawnSync,
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
    get git_options() {
      return mocked.git_options;
    },
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    mocked.dry_run = true;
    mocked.git_options = [];
    mocked.execFileSync.mockReset();
    mocked.execFileSync.mockImplementation((_file, args: string[]) => {
      if (args.includes("show-ref")) throw new Error("branch missing");
      return Buffer.from("");
    });
    mocked.execSync.mockReset();
    mocked.spawnSync.mockReset();
    mocked.spawnSync.mockImplementation((_file, args: string[]) => ({
      status: 0,
      stdout: args.at(-1),
      stderr: "",
    }));
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

    expect(mocked.execFileSync).toHaveBeenCalledTimes(1);
    expect(mocked.execFileSync).toHaveBeenCalledWith(
      "git",
      [
        "show-ref",
        "--verify",
        "--quiet",
        "refs/heads/feat/TAC-123-cli-add-parser",
      ],
      { encoding: "utf-8" },
    );
    expect(mocked.info).toHaveBeenCalledWith(
      "Dry run: git worktree add -b feat/TAC-123-cli-add-parser ../worktrees/repo-TAC-123-add-parser",
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
    expect(mocked.execFileSync).toHaveBeenCalledTimes(1);
    expect(mocked.info).toHaveBeenCalledWith(
      `Dry run: echo pre ${sq("TAC-123")}`,
    );
    expect(mocked.info).toHaveBeenCalledWith(
      "Dry run: git checkout -b feat/TAC-123-cli-add-parser",
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

  it("passes git-dir and work-tree as literal arguments", async () => {
    mocked.dry_run = false;
    mocked.git_options = [
      "--git-dir=/tmp/my repo/.git",
      "--work-tree=/tmp/my repo",
    ];
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {});
    const branch_state = parse(BranchState, {
      type: "feat",
      description: "safe-branch",
      checkout: "branch",
    });

    await new BranchConfirmPrompt(config, branch_state, {} as never).run();

    expect(mocked.execFileSync).toHaveBeenNthCalledWith(
      2,
      "git",
      [
        "--git-dir=/tmp/my repo/.git",
        "--work-tree=/tmp/my repo",
        "checkout",
        "-b",
        "feat/safe-branch",
      ],
      { stdio: "inherit" },
    );
  });

  it("exits non-zero when branch validation fails", async () => {
    mocked.spawnSync.mockReturnValue({
      status: 128,
      stdout: "",
      stderr: "fatal: 'feat/a..b' is not a valid branch name",
    });
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code): never => {
        throw new Error(`exit ${code}`);
      });
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {});
    const branch_state = parse(BranchState, {
      type: "feat",
      description: "a..b",
      checkout: "branch",
    });

    await expect(
      new BranchConfirmPrompt(config, branch_state, {} as never).run(),
    ).rejects.toThrow("exit 1");

    expect(exit).toHaveBeenCalledWith(1);
    expect(mocked.execFileSync).not.toHaveBeenCalled();
    exit.mockRestore();
  });

  it("exits non-zero when checkout fails", async () => {
    mocked.dry_run = false;
    mocked.execFileSync.mockImplementation(() => {
      throw new Error("checkout failed");
    });
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code): never => {
        throw new Error(`exit ${code}`);
      });
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {});
    const branch_state = parse(BranchState, {
      type: "feat",
      description: "safe-branch",
      checkout: "branch",
    });

    await expect(
      new BranchConfirmPrompt(config, branch_state, {} as never).run(),
    ).rejects.toThrow("exit 1");

    expect(exit).toHaveBeenCalledWith(1);
    expect(mocked.error).toHaveBeenCalledWith(
      "Failed to checkout branch 'feat/safe-branch'",
    );
    exit.mockRestore();
  });

  it("exits non-zero when worktree creation fails", async () => {
    mocked.dry_run = false;
    mocked.execFileSync.mockImplementation(() => {
      throw new Error("worktree failed");
    });
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code): never => {
        throw new Error(`exit ${code}`);
      });
    const { BranchConfirmPrompt } = await import("./branch-confirm.prompt");
    const config = parse(Config, {
      worktrees: { base_path: "../worktrees" },
    });
    const branch_state = parse(BranchState, {
      type: "feat",
      description: "safe-worktree",
      checkout: "worktree",
    });

    await expect(
      new BranchConfirmPrompt(config, branch_state, {} as never).run(),
    ).rejects.toThrow("exit 1");

    expect(exit).toHaveBeenCalledWith(1);
    expect(mocked.error).toHaveBeenCalledWith(
      "Failed to create worktree '../worktrees/repo-safe-worktree'",
    );
    exit.mockRestore();
  });
});
