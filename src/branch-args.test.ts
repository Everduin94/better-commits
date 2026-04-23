import { describe, expect, it } from "vitest";
import { parse_branch_runtime_flags } from "./branch-args";

describe("parse_branch_runtime_flags", () => {
  it("maps branch flags into branch_state keys", () => {
    const parsed = parse_branch_runtime_flags([
      "--user",
      "erik",
      "--type",
      "feat",
      "--ticket",
      "ABC-123",
      "--description",
      "add-parser",
      "--branch-version",
      "1.2.0",
    ]);

    expect(parsed.branch_state).toEqual({
      user: "erik",
      type: "feat",
      ticket: "ABC-123",
      description: "add-parser",
      version: "1.2.0",
    });
  });

  it("maps --checkout into checkout", () => {
    const parsed = parse_branch_runtime_flags(["--checkout", "worktree"]);

    expect(parsed.branch_state).toEqual({
      checkout: "worktree",
    });
  });

  it("does not set checkout when --checkout is omitted", () => {
    const parsed = parse_branch_runtime_flags([
      "--type",
      "feat",
      "--description",
      "add-parser",
    ]);

    expect(parsed.branch_state).toEqual({
      type: "feat",
      description: "add-parser",
    });
  });

  it("honors interactive flag semantics", () => {
    const default_flags = parse_branch_runtime_flags([]);
    const explicit_interactive = parse_branch_runtime_flags(["--interactive"]);
    const no_interactive = parse_branch_runtime_flags(["--no-interactive"]);

    expect(default_flags.no_interactive).toBe(false);
    expect(explicit_interactive.no_interactive).toBe(false);
    expect(no_interactive.no_interactive).toBe(true);
  });

  it("parses git-dir and work-tree into git_args", () => {
    const parsed = parse_branch_runtime_flags([
      "--git-dir",
      "/tmp/repo/.git",
      "--work-tree",
      "/tmp/repo",
    ]);

    expect(parsed.git_args).toBe(
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );
  });
});
