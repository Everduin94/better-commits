import { describe, expect, it } from "vitest";
import { parse } from "valibot";
import { BranchState, Config } from "../valibot-state";
import { build_branch, build_worktree_path } from "./build-branch";

function make_config(input: Record<string, unknown> = {}) {
  return parse(Config, input);
}

function make_branch(input: Record<string, unknown>) {
  return parse(BranchState, input);
}

describe("build_branch", () => {
  it("builds branch with default order and separators", () => {
    const branch = make_branch({
      user: "erik",
      version: "1.2.0",
      type: "feat",
      scope: "app",
      ticket: "ABC-1",
      description: "add-parser",
    });
    const config = make_config();

    expect(build_branch(branch, config)).toBe(
      "erik/1.2.0/feat/ABC-1-app-add-parser",
    );
  });

  it("builds branch without scope when scope is empty", () => {
    const branch = make_branch({
      user: "erik",
      type: "feat",
      scope: "",
      ticket: "ABC-1",
      description: "add-parser",
    });
    const config = make_config();

    expect(build_branch(branch, config)).toBe("erik/feat/ABC-1-add-parser");
  });

  it("omits empty fields without leaving trailing separators", () => {
    const branch = make_branch({
      user: "erik",
      type: "fix",
      description: "repair-parser",
    });
    const config = make_config();

    expect(build_branch(branch, config)).toBe("erik/fix/repair-parser");
  });

  it("respects custom branch order", () => {
    const branch = make_branch({
      type: "feat",
      ticket: "ABC-1",
      description: "add-parser",
      user: "erik",
    });
    const config = make_config({
      branch_order: ["type", "ticket", "description", "user"],
      branch_description: { separator: "/" },
    });

    expect(build_branch(branch, config)).toBe("feat/ABC-1-add-parser/erik");
  });

  it("uses per-field separator config", () => {
    const branch = make_branch({
      user: "erik",
      type: "feat",
      scope: "app",
      ticket: "ABC-1",
      description: "parser",
    });
    const config = make_config({
      branch_user: { separator: "_" },
      branch_type: { separator: "-" },
      branch_scope: { separator: "/" },
      branch_ticket: { separator: "_" },
      branch_description: { separator: "" },
      branch_order: ["user", "type", "ticket", "scope", "description"],
    });

    expect(build_branch(branch, config)).toBe("erik_feat-ABC-1_app/parser");
  });
});

describe("build_worktree_path", () => {
  it("builds path from template tokens", () => {
    const branch = make_branch({
      user: "erik",
      type: "feat",
      scope: "cli",
      ticket: "ABC-1",
      description: "add-parser",
      version: "1.2.0",
    });
    const config = make_config({
      worktrees: {
        base_path: "../worktrees",
        folder_template:
          "{{repo_name}}-{{scope}}-{{ticket}}-{{branch_description}}",
      },
    });

    const result = build_worktree_path(branch, config, "/tmp/my-repo");
    expect(result).toBe("../worktrees/my-repo-cli-ABC-1-add-parser");
  });

  it("handles base_path with trailing slash", () => {
    const branch = make_branch({
      description: "add-parser",
    });
    const config = make_config({
      worktrees: {
        base_path: "../wt/",
        folder_template: "{{repo_name}}-{{branch_description}}",
      },
    });

    const result = build_worktree_path(branch, config, "/tmp/repo");
    expect(result).toBe("../wt/repo-add-parser");
  });

  it("normalizes repeated dashes and trims edges", () => {
    const branch = make_branch({
      ticket: "",
      description: "parser",
    });
    const config = make_config({
      worktrees: {
        base_path: "../wt",
        folder_template: "-{{repo_name}}--{{ticket}}--{{branch_description}}-",
      },
    });

    const result = build_worktree_path(branch, config, "/tmp/repo");
    expect(result).toBe("../wt/repo-parser");
  });

  it("removes whitespace from rendered worktree name", () => {
    const branch = make_branch({
      user: "erik",
      description: "new feature",
    });
    const config = make_config({
      worktrees: {
        base_path: "../wt",
        folder_template: "{{repo_name}}-{{user}}-{{branch_description}}",
      },
    });

    const result = build_worktree_path(branch, config, "/tmp/repo");
    expect(result).toBe("../wt/repo-erik-newfeature");
  });
});
