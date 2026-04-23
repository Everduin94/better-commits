import { describe, expect, it } from "vitest";
import { parse } from "valibot";
import { BranchState, Config } from "../valibot-state";
import { create_strict_branch_state } from "./no-interactive-validation";

function make_config(input: Record<string, unknown> = {}) {
  return parse(Config, input);
}

function make_state(input: Record<string, unknown>) {
  return parse(BranchState, input);
}

describe("create_strict_branch_state", () => {
  it("accepts valid parsed branch state input", () => {
    const config = make_config();
    const schema = create_strict_branch_state(config);

    const result = parse(
      schema,
      make_state({
        type: "feat",
        description: "add-parser",
      }),
    );

    expect(result.type).toBe("feat");
    expect(result.description).toBe("add-parser");
  });

  it('defaults checkout to "branch" when omitted', () => {
    const config = make_config();
    const schema = create_strict_branch_state(config);

    const result = parse(
      schema,
      make_state({
        type: "feat",
        description: "add-parser",
      }),
    );

    expect(result.checkout).toBe("branch");
  });

  it("rejects types that are not in config.commit_type.options", () => {
    const config = make_config();
    const schema = create_strict_branch_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "unknown",
          description: "add-parser",
        }),
      ),
    ).toThrow(/Invalid --type "unknown"/);
  });

  it("rejects missing descriptions", () => {
    const config = make_config();
    const schema = create_strict_branch_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
        }),
      ),
    ).toThrow(/Missing --description/);
  });

  it("rejects descriptions that exceed branch_description.max_length", () => {
    const config = make_config({
      branch_description: {
        max_length: 5,
      },
    });
    const schema = create_strict_branch_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
          description: "too-long",
        }),
      ),
    ).toThrow(/Description exceeds max length/);
  });

  it("rejects missing ticket when branch_ticket.required is enabled", () => {
    const config = make_config({
      branch_ticket: {
        required: true,
      },
    });
    const schema = create_strict_branch_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
          description: "add-parser",
        }),
      ),
    ).toThrow(/Missing --ticket/);
  });

  it("rejects missing version when branch_version.required is enabled", () => {
    const config = make_config({
      branch_version: {
        required: true,
      },
    });
    const schema = create_strict_branch_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
          description: "add-parser",
        }),
      ),
    ).toThrow(/Missing --branch-version/);
  });

  it("rejects missing user when branch_user.required is enabled", () => {
    const config = make_config({
      branch_user: {
        required: true,
      },
    });
    const schema = create_strict_branch_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
          description: "add-parser",
        }),
      ),
    ).toThrow(/Missing --user/);
  });

  it("allows worktree checkout even when worktrees are disabled", () => {
    const config = make_config({
      worktrees: {
        enable: false,
      },
    });
    const schema = create_strict_branch_state(config);

    const result = parse(
      schema,
      make_state({
        type: "feat",
        description: "add-parser",
        checkout: "worktree",
      }),
    );

    expect(result.checkout).toBe("worktree");
  });
});
