import { describe, expect, it } from "vitest";
import { parse_runtime_flags } from "./args";

describe("parse_runtime_flags", () => {
  it("uses interactive mode by default", () => {
    const parsed = parse_runtime_flags([]);

    expect(parsed.no_interactive).toBe(false);
    expect(parsed.dry_run).toBe(false);
    expect(parsed.git_args).toBe("");
    expect(parsed.commit_state).toEqual({});
  });

  it("parses --no-interactive and --dry-run", () => {
    const parsed = parse_runtime_flags(["--no-interactive", "--dry-run"]);

    expect(parsed.no_interactive).toBe(true);
    expect(parsed.dry_run).toBe(true);
  });

  it("parses --version and -v", () => {
    const long_flag = parse_runtime_flags(["--version"]);
    const short_flag = parse_runtime_flags(["-v"]);

    expect(long_flag.version).toBe(true);
    expect(short_flag.version).toBe(true);
  });

  it("maps commit flags into commit_state keys", () => {
    const parsed = parse_runtime_flags([
      "--type",
      "feat",
      "--title",
      "ship feature",
      "--breaking-title",
      "api changed",
      "--custom-footer",
      "Reviewed-by: Jane",
    ]);

    expect(parsed.commit_state).toEqual({
      type: "feat",
      title: "ship feature",
      breaking_title: "api changed",
      custom_footer: "Reviewed-by: Jane",
    });
  });

  it("treats bare --closes as enabling the default closes footer", () => {
    const parsed = parse_runtime_flags(["--closes"]);

    expect(parsed.commit_state).toEqual({
      closes: "Closes:",
    });
  });

  it("normalizes boolean-style closes values", () => {
    const enabled = parse_runtime_flags(["--closes=true"]);
    const disabled = parse_runtime_flags(["--closes=false"]);

    expect(enabled.commit_state).toEqual({
      closes: "Closes:",
    });
    expect(disabled.commit_state).toEqual({});
  });

  it("treats any truthy closes value as the default closes footer", () => {
    const parsed = parse_runtime_flags(["--closes", "Resolves:"]);

    expect(parsed.commit_state).toEqual({
      closes: "Closes:",
    });
  });

  it("builds git args from --git-dir and --work-tree", () => {
    const parsed = parse_runtime_flags([
      "--git-dir",
      "/tmp/repo/.git",
      "--work-tree",
      "/tmp/repo",
    ]);

    expect(parsed.git_args).toBe(
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );
  });

  it("builds git args when only one git location flag is provided", () => {
    const with_git_dir = parse_runtime_flags(["--git-dir", "/tmp/repo/.git"]);
    const with_work_tree = parse_runtime_flags(["--work-tree", "/tmp/repo"]);

    expect(with_git_dir.git_args).toBe("--git-dir=/tmp/repo/.git");
    expect(with_work_tree.git_args).toBe("--work-tree=/tmp/repo");
  });

  it("maps dashed commit flags to snake_case commit_state keys", () => {
    const parsed = parse_runtime_flags([
      "--breaking-body",
      "major impact",
      "--deprecates-title",
      "legacy endpoint",
      "--deprecates-body",
      "use v2 endpoint",
      "--custom-footer",
      "Reviewed-by: Alex",
      "--breaking-title",
      "v1 removed",
    ]);

    expect(parsed.commit_state).toEqual({
      breaking_body: "major impact",
      deprecates_title: "legacy endpoint",
      deprecates_body: "use v2 endpoint",
      custom_footer: "Reviewed-by: Alex",
      breaking_title: "v1 removed",
    });
  });

  it("honors interactive flag semantics", () => {
    const default_flags = parse_runtime_flags([]);
    const explicit_interactive = parse_runtime_flags(["--interactive"]);
    const no_interactive = parse_runtime_flags(["--no-interactive"]);

    expect(default_flags.no_interactive).toBe(false);
    expect(explicit_interactive.no_interactive).toBe(false);
    expect(no_interactive.no_interactive).toBe(true);
  });
});
