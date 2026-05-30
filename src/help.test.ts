import { describe, expect, it, vi } from "vitest";
import { parse } from "valibot";
import { Config } from "./valibot-state";
import { print_help_text } from "./help";

vi.mock("child_process", () => ({
  execSync: vi.fn(() => Buffer.from("feat/app-123-add-parser\n")),
}));

describe("print_help_text", () => {
  it("prints JSON help output with --json metadata", () => {
    const log_spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const config = parse(Config, {});

    print_help_text(config, "repository", true);

    expect(log_spy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(String(log_spy.mock.calls[0][0]));
    expect(output.command).toBe("better-commits");
    expect(output.configuration.source).toBe("repository");
    expect(output.flags.cli["--json"]).toContain("JSON");
    expect(output.branch.inferred.type).toBe("feat");

    log_spy.mockRestore();
  });
});
