import { describe, expect, it } from "vitest";
import { parse } from "valibot";
import { render_hook_command } from "./render-hook-command";
import { BranchState } from "../valibot-state";

const state = (overrides: Partial<Record<string, string>> = {}) =>
  parse(BranchState, overrides);

/**
 * POSIX single-quote shell escaping: wrap the value in single quotes and
 * replace every embedded `'` with the `'\''` close-escape-reopen sequence.
 * This is the escaping the implementation is expected to apply to every
 * known token value before substitution, producing a single self-quoting
 * shell argument.
 */
const sq = (value: string): string => `'${value.replaceAll("'", `'\\''`)}'`;

describe("render_hook_command", () => {
  describe("known tokens are replaced with a single-quoted, escaped value", () => {
    it("renders a single template", () => {
      expect(
        render_hook_command(
          "runScript({{TICKET}})",
          state({ ticket: "AVF-123" }),
        ),
      ).toBe(`runScript(${sq("AVF-123")})`);
    });

    it("renders the same template repeated multiple times", () => {
      expect(
        render_hook_command(
          "{{TICKET}}-{{TICKET}}",
          state({ ticket: "AVF-123" }),
        ),
      ).toBe(`${sq("AVF-123")}-${sq("AVF-123")}`);
    });

    it("renders multiple distinct templates in one command", () => {
      expect(
        render_hook_command(
          "{{TYPE}}/{{TICKET}}/{{TICKET}}",
          state({ type: "feat", ticket: "AVF-123" }),
        ),
      ).toBe(`${sq("feat")}/${sq("AVF-123")}/${sq("AVF-123")}`);
    });

    it("supports every documented template token", () => {
      expect(
        render_hook_command(
          "{{USER}}|{{TYPE}}|{{SCOPE}}|{{DESCRIPTION}}|{{TICKET}}|{{BRANCH-VERSION}}|{{CHECKOUT}}",
          state({
            user: "everduin94",
            type: "feat",
            scope: "cli",
            description: "add-filters",
            ticket: "AVF-123",
            version: "v2",
            checkout: "worktree",
          }),
        ),
      ).toBe(
        [
          sq("everduin94"),
          sq("feat"),
          sq("cli"),
          sq("add-filters"),
          sq("AVF-123"),
          sq("v2"),
          sq("worktree"),
        ].join("|"),
      );
    });

    it("replaces a valid but unset value with a quoted empty string", () => {
      expect(
        render_hook_command("runScript({{SCOPE}})", state({ scope: "" })),
      ).toBe(`runScript(${sq("")})`);
    });

    it("replaces an unset value with a quoted empty string when not provided at all", () => {
      expect(render_hook_command("runScript({{DESCRIPTION}})", state())).toBe(
        `runScript(${sq("")})`,
      );
    });

    it("escapes embedded single quotes so the result is one self-quoting argument", () => {
      expect(
        render_hook_command(
          "runScript({{TICKET}})",
          state({ ticket: "AVF's-123" }),
        ),
      ).toBe(`runScript(${sq("AVF's-123")})`);
      expect(
        render_hook_command(
          "runScript({{TICKET}})",
          state({ ticket: "AVF's-123" }),
        ),
      ).toBe("runScript('AVF'\\''s-123')");
    });

    it("neutralizes shell metacharacters and command injection attempts", () => {
      const malicious = "AVF-123; rm -rf / && echo $(whoami) | cat `id` > out";
      expect(
        render_hook_command(
          "runScript({{TICKET}})",
          state({ ticket: malicious }),
        ),
      ).toBe(`runScript(${sq(malicious)})`);
    });

    it("does one rendering pass; substituted values are not re-rendered", () => {
      expect(
        render_hook_command("{{TICKET}}", state({ ticket: "{{TICKET}}" })),
      ).toBe(sq("{{TICKET}}"));
    });
  });

  describe("only exact, known token forms are recognized", () => {
    it("leaves a lowercase token unchanged and does not throw", () => {
      expect(() =>
        render_hook_command(
          "runScript({{ticket}})",
          state({ ticket: "AVF-123" }),
        ),
      ).not.toThrow();
      expect(
        render_hook_command(
          "runScript({{ticket}})",
          state({ ticket: "AVF-123" }),
        ),
      ).toBe("runScript({{ticket}})");
    });

    it("leaves whitespace-padded tokens unchanged", () => {
      const cases = [
        "{{ TICKET }}",
        "{{TICKET }}",
        "{{ TICKET}}",
        "{{\tTICKET\t}}",
      ];
      for (const template of cases) {
        expect(
          render_hook_command(template, state({ ticket: "AVF-123" })),
        ).toBe(template);
      }
    });

    it("leaves an unknown token unchanged and does not throw", () => {
      expect(() =>
        render_hook_command("runScript({{NOPE}})", state()),
      ).not.toThrow();
      expect(render_hook_command("runScript({{NOPE}})", state())).toBe(
        "runScript({{NOPE}})",
      );
    });

    it("leaves an unknown token unchanged even alongside valid ones", () => {
      expect(
        render_hook_command("{{TYPE}}/{{NOPE}}", state({ type: "feat" })),
      ).toBe(`${sq("feat")}/{{NOPE}}`);
    });

    it("leaves extended token names that merely contain a known token unchanged", () => {
      const cases = [
        "{{TICKETX}}",
        "{{TICKET_EXTRA}}",
        "{{TICKETS}}",
        "{{XTICKET}}",
      ];
      for (const template of cases) {
        expect(
          render_hook_command(template, state({ ticket: "AVF-123" })),
        ).toBe(template);
      }
    });

    it("leaves triple-braced forms unchanged", () => {
      expect(
        render_hook_command("{{{TICKET}}}", state({ ticket: "AVF-123" })),
      ).toBe("{{{TICKET}}}");
    });

    it("leaves quadruple-braced forms unchanged", () => {
      expect(
        render_hook_command("{{{{TICKET}}}}", state({ ticket: "AVF-123" })),
      ).toBe("{{{{TICKET}}}}");
    });

    it("does not throw for any unrecognized or malformed template shape", () => {
      const templates = [
        "{{ticket}}",
        "{{NOPE}}",
        "{{TICKETX}}",
        "{{{TICKET}}}",
        "{{}}",
        "{{ }}",
      ];
      for (const template of templates) {
        expect(() => render_hook_command(template, state())).not.toThrow();
      }
    });
  });

  it("preserves commands without templates unchanged", () => {
    expect(render_hook_command("plain command", state())).toBe("plain command");
  });

  it("preserves an empty command string unchanged", () => {
    expect(render_hook_command("", state())).toBe("");
  });
});
