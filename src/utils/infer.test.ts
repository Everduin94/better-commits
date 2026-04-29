import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("../args", () => ({
  flags: {
    interactive: false,
    git_args: "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
  },
}));

import { execSync } from "child_process";
import { parse } from "valibot";
import { Config } from "../valibot-state";
import {
  infer_not_interactive,
  infer_scope_from_git,
  infer_ticket_from_git,
  infer_type_from_git,
} from "./infer";

const execSyncMock = vi.mocked(execSync);

describe("infer", () => {
  beforeEach(() => {
    execSyncMock.mockReset();
  });

  it('prepends hashtags for inferred tickets when prepend_hashtag is "Always"', () => {
    execSyncMock.mockReturnValue(Buffer.from("feat/127-cli-bombshell-args\n"));

    const result = infer_ticket_from_git(
      {
        append_hashtag: false,
        prepend_hashtag: "Always",
      },
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("#127");
  });

  it('returns plain inferred tickets when prepend_hashtag is "Never"', () => {
    execSyncMock.mockReturnValue(Buffer.from("feat/ABC-123-add-parser\n"));

    const result = infer_ticket_from_git(
      {
        append_hashtag: false,
        prepend_hashtag: "Never",
      },
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("ABC-123");
  });

  it("infers commit types from the current branch", () => {
    execSyncMock.mockReturnValue(
      Buffer.from("everduin94/feat/ABC-123-add-parser\n"),
    );

    const result = infer_type_from_git(
      [{ value: "feat" }, { value: "fix" }],
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("feat");
  });

  it("infers commit scopes after ticket from branch descriptions", () => {
    execSyncMock.mockReturnValue(
      Buffer.from("everduin94/feat/CXP-12345-avf-fix-filters\n"),
    );

    const result = infer_scope_from_git(
      [{ value: "app" }, { value: "avf" }],
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("avf");
  });

  it("falls back to standalone scope words elsewhere in the branch", () => {
    execSyncMock.mockReturnValue(
      Buffer.from("everduin94/feat/server/ABC-123-add-parser\n"),
    );

    const result = infer_scope_from_git(
      [{ value: "app" }, { value: "server" }],
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("server");
  });

  it("infers commit scopes separated by underscores", () => {
    execSyncMock.mockReturnValue(Buffer.from("feat/TICKET_app_desc\n"));

    const result = infer_scope_from_git(
      [{ value: "app" }, { value: "server" }],
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("app");
  });

  it("does not infer scopes from partial branch words", () => {
    execSyncMock.mockReturnValue(
      Buffer.from("feat/application/ABC-123-add-parser\n"),
    );

    const result = infer_scope_from_git(
      [{ value: "app" }, { value: "server" }],
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("");
  });

  it("does not infer scopes from partial suffix matches before a slash", () => {
    execSyncMock.mockReturnValue(Buffer.from("feat/myapp/ABC-123-add-parser\n"));

    const result = infer_scope_from_git(
      [{ value: "app" }, { value: "server" }],
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("");
  });

  it("handles scope values containing regex metacharacters", () => {
    execSyncMock.mockReturnValue(Buffer.from("feat/ui.v2/ABC-123-add-parser\n"));

    const result = infer_scope_from_git(
      [{ value: "ui.v2" }, { value: "server" }],
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("ui.v2");
  });

  it("prefers longer scope matches", () => {
    execSyncMock.mockReturnValue(
      Buffer.from("feat/api-v2/ABC-123-add-parser\n"),
    );

    const result = infer_scope_from_git(
      [{ value: "api" }, { value: "api-v2" }],
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("api-v2");
  });

  it("builds no-interactive inferred state using current config settings", () => {
    execSyncMock.mockReturnValue(
      Buffer.from("feat/127-app-cli-bombshell-args\n"),
    );

    const config = parse(Config, {
      check_ticket: {
        prepend_hashtag: "Always",
      },
    });

    expect(infer_not_interactive(config)).toEqual({
      ticket: "#127",
      type: "feat",
      scope: "app",
    });
  });
});
