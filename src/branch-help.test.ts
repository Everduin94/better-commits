import { describe, expect, it, vi } from "vitest";
import { parse } from "valibot";
import { Config } from "./valibot-state";
import { print_help_text } from "./branch-help";

vi.mock("child_process", () => ({
  execSync: vi.fn(() => Buffer.from("feat/app-123-add-parser\n")),
}));

describe("branch print_help_text", () => {
  it("prints JSON help output with branch flags", () => {
    const log_spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const config = parse(Config, {});

    print_help_text(config, "global", true);

    expect(log_spy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(String(log_spy.mock.calls[0][0]));
    expect(output.command).toBe("better-branch");
    expect(output.configuration.source).toBe("global");
    expect(output.flags.cli["--json"]).toContain("JSON");
    expect(output.flags.branch["--checkout"]).toContain("checkout");

    log_spy.mockRestore();
  });
});
