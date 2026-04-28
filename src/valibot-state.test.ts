import { describe, expect, it } from "vitest";
import { ValiError, parse } from "valibot";
import { Config } from "./valibot-state";

describe("Config", () => {
  it("parses a defaulted config from empty input", () => {
    const config = parse(Config, {});

    expect(config.commit_type.initial_value).toBe("feat");
    expect(config.commit_scope.initial_value).toBe("app");
    expect(config.commit_scope.infer_scope_from_branch).toBe(true);
    expect(config.branch_order).toEqual([
      "user",
      "version",
      "type",
      "ticket",
      "scope",
      "description",
    ]);
    expect(config.commit_type.options.length).toBeGreaterThan(0);
    expect(config.commit_scope.options.length).toBeGreaterThan(0);
  });

  it("adds the custom scope option when custom_scope is enabled", () => {
    const config = parse(Config, {
      commit_scope: {
        custom_scope: true,
        initial_value: "custom",
        options: [{ value: "app", label: "app" }],
      },
    });

    expect(config.commit_scope.options.map((option) => option.value)).toContain(
      "custom",
    );
  });

  it("rejects commit_type.initial_value values outside options", () => {
    expect(() =>
      parse(Config, {
        commit_type: {
          initial_value: "unknown",
          options: [{ value: "feat", label: "feat" }],
        },
      }),
    ).toThrowError(ValiError);

    expect(() =>
      parse(Config, {
        commit_type: {
          initial_value: "unknown",
          options: [{ value: "feat", label: "feat" }],
        },
      }),
    ).toThrow(/must exist in options/);
  });
});
