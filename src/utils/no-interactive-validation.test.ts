import { describe, expect, it } from "vitest";
import { parse } from "valibot";
import { CommitState, Config } from "../valibot-state";
import { create_strict_commit_state } from "./no-interactive-validation";

function make_config(input: Record<string, unknown> = {}) {
  return parse(Config, input);
}

function make_state(input: Record<string, unknown>) {
  return parse(CommitState, input);
}

describe("create_strict_commit_state", () => {
  it("accepts valid parsed commit state input", () => {
    const config = make_config();
    const schema = create_strict_commit_state(config);

    const result = parse(
      schema,
      make_state({
        type: "feat",
        title: "add parser",
      }),
    );

    expect(result.type).toBe("feat");
    expect(result.title).toBe("add parser");
  });

  it("rejects types that are not in config.commit_type.options", () => {
    const config = make_config();
    const schema = create_strict_commit_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "unknown",
          title: "add parser",
        }),
      ),
    ).toThrow(/Invalid --type "unknown"/);
  });

  it("allows custom scopes when custom_scope is enabled", () => {
    const config = make_config({
      commit_scope: {
        custom_scope: true,
        initial_value: "custom",
        options: [{ value: "app", label: "app" }],
      },
    });
    const schema = create_strict_commit_state(config);

    const result = parse(
      schema,
      make_state({
        type: "feat",
        scope: "custom-auth",
        title: "add parser",
      }),
    );

    expect(result.scope).toBe("custom-auth");
  });

  it("rejects scopes outside configured options when custom_scope is disabled", () => {
    const config = make_config({
      commit_scope: {
        custom_scope: false,
        options: [{ value: "app", label: "app" }],
      },
    });
    const schema = create_strict_commit_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
          scope: "custom-auth",
          title: "add parser",
        }),
      ),
    ).toThrow(/Invalid --scope "custom-auth"/);
  });

  it("rejects missing body when commit_body.required is enabled", () => {
    const config = make_config({
      commit_body: {
        required: true,
      },
    });
    const schema = create_strict_commit_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
          title: "add parser",
        }),
      ),
    ).toThrow(/Missing --body/);
  });

  it("rejects titles that exceed commit_title.max_size", () => {
    const config = make_config({
      commit_title: {
        max_size: 10,
      },
    });
    const schema = create_strict_commit_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
          title: "too long title",
        }),
      ),
    ).toThrow(/Title exceeds max width/);
  });

  it("rejects closes footers without a ticket", () => {
    const config = make_config();
    const schema = create_strict_commit_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
          title: "add parser",
          closes: "Closes:",
        }),
      ),
    ).toThrow(/--closes requires --ticket/);
  });

  it("rejects breaking bodies without breaking titles", () => {
    const config = make_config();
    const schema = create_strict_commit_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
          title: "add parser",
          breaking_body: "migration needed",
        }),
      ),
    ).toThrow(/--breaking-body requires --breaking-title/);
  });

  it("rejects deprecates bodies without deprecates titles", () => {
    const config = make_config();
    const schema = create_strict_commit_state(config);

    expect(() =>
      parse(
        schema,
        make_state({
          type: "feat",
          title: "add parser",
          deprecates_body: "use the new api",
        }),
      ),
    ).toThrow(/--deprecates-body requires --deprecates-title/);
  });
});
