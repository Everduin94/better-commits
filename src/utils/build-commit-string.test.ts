import { describe, expect, it } from "vitest";
import { InferOutput, parse } from "valibot";
import { CommitState, Config } from "../valibot-state";
import { build_commit_string } from "./build-commit-string";

type ConfigOutput = InferOutput<typeof Config>;
type ConfigOverrides = Partial<
  Omit<ConfigOutput, "check_ticket" | "breaking_change">
> & {
  check_ticket?: Partial<ConfigOutput["check_ticket"]>;
  breaking_change?: Partial<ConfigOutput["breaking_change"]>;
};

function make_config(overrides?: ConfigOverrides): ConfigOutput {
  const base = parse_config({});
  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    check_ticket: {
      ...base.check_ticket,
      ...(overrides.check_ticket ?? {}),
    },
    breaking_change: {
      ...base.breaking_change,
      ...(overrides.breaking_change ?? {}),
    },
  };
}

function parse_config(input: Record<string, unknown>) {
  return parse(Config, input);
}

function make_state(input: Record<string, unknown>) {
  return parse(CommitState, input);
}

describe("build_commit_string", () => {
  it("builds a basic conventional commit title", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "feat",
        scope: "api",
        title: "add endpoint",
      }),
      config: make_config(),
    });

    expect(result).toBe("feat(api): add endpoint");
  });

  it("adds ticket at start of title by default", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "fix",
        title: "handle null values",
        ticket: "ABC-123",
      }),
      config: make_config(),
    });

    expect(result).toBe("fix: ABC-123 handle null values");
  });

  it("supports ticket before colon", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "feat",
        scope: "core",
        title: "ship parser",
        ticket: "PROJ-9",
      }),
      config: make_config({
        check_ticket: {
          title_position: "before-colon",
        },
      }),
    });

    expect(result).toBe("feat(core) PROJ-9: ship parser");
  });

  it("supports ticket wrapping when surround is configured", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "chore",
        title: "update docs",
        ticket: "42",
      }),
      config: make_config({
        check_ticket: {
          surround: "[]",
        },
      }),
    });

    expect(result).toBe("chore: [42] update docs");
  });

  it("supports ticket at end of title", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "chore",
        title: "cleanup docs",
        ticket: "DOC-7",
      }),
      config: make_config({
        check_ticket: {
          title_position: "end",
        },
      }),
    });

    expect(result).toBe("chore: cleanup docs DOC-7");
  });

  it("supports ticket at beginning of commit header", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "feat",
        scope: "api",
        title: "add endpoint",
        ticket: "ABC-1",
      }),
      config: make_config({
        check_ticket: {
          title_position: "beginning",
        },
      }),
    });

    expect(result).toBe("ABC-1 feat(api): add endpoint");
  });

  it("appends body and footer blocks with spacing", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "feat",
        title: "add cli",
        body: "line 1\\nline 2",
        custom_footer: "Refs: ABC-1",
      }),
      config: make_config(),
    });

    expect(result).toBe("feat: add cli\n\nline 1\nline 2\n\nRefs: ABC-1");
  });

  it("includes trailer only when include_trailer is true", () => {
    const state = make_state({
      type: "feat",
      title: "add cli",
      trailer: "Signed-off-by: Erik",
    });
    const config = make_config();

    const no_trailer = build_commit_string({
      commit_state: state,
      config,
      include_trailer: false,
    });
    const with_trailer = build_commit_string({
      commit_state: state,
      config,
      include_trailer: true,
    });

    expect(no_trailer).toBe("feat: add cli");
    expect(with_trailer).toBe("feat: add cli\n\nSigned-off-by: Erik");
  });

  it("skips title ticket when add_to_title is false but keeps closes footer", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "fix",
        title: "repair parser",
        ticket: "BUG-99",
        closes: "closes",
      }),
      config: make_config({
        check_ticket: {
          add_to_title: false,
        },
      }),
    });

    expect(result).toBe("fix: repair parser\n\ncloses BUG-99");
  });

  it("adds breaking exclamation when enabled", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "feat",
        title: "replace api",
        breaking_title: "v1 removed",
      }),
      config: make_config({
        breaking_change: {
          add_exclamation_to_title: true,
        },
      }),
    });

    expect(result).toBe("feat!: replace api\n\nBREAKING CHANGE: v1 removed");
  });

  it("renders deprecation title and body blocks", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "chore",
        title: "remove legacy helper",
        deprecates_title: "legacy helper",
        deprecates_body: "use modern helper",
      }),
      config: make_config(),
    });

    expect(result).toBe(
      "chore: remove legacy helper\n\nDEPRECATED: legacy helper\n\nuse modern helper",
    );
  });

  it("formats before-colon ticket without type and scope", () => {
    const result = build_commit_string({
      commit_state: make_state({
        title: "ship parser",
        ticket: "PROJ-9",
      }),
      config: make_config({
        check_ticket: {
          title_position: "before-colon",
        },
      }),
    });

    expect(result).toBe("PROJ-9: ship parser");
  });

  it("escapes double quotes and backticks for shell-safe command composition", () => {
    const result = build_commit_string({
      commit_state: make_state({
        type: "fix",
        title: 'handle "quoted" `inline` value',
      }),
      config: make_config(),
      escape_quotes: true,
    });

    expect(result).toBe('fix: handle \\"quoted\\" \\`inline\\` value');
  });
});
