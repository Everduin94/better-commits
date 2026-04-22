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
    execSyncMock.mockReturnValue(Buffer.from("everduin94/feat/ABC-123-add-parser\n"));

    const result = infer_type_from_git(
      [{ value: "feat" }, { value: "fix" }],
      "--git-dir=/tmp/repo/.git --work-tree=/tmp/repo",
    );

    expect(result).toBe("feat");
  });

  it("builds no-interactive inferred state using current config settings", () => {
    execSyncMock.mockReturnValue(Buffer.from("feat/127-cli-bombshell-args\n"));

    const config = parse(Config, {
      check_ticket: {
        prepend_hashtag: "Always",
      },
    });

    expect(infer_not_interactive(config)).toEqual({
      ticket: "#127",
      type: "feat",
    });
  });
});
