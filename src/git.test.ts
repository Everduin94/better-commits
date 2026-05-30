import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  error: vi.fn(),
  execSync: vi.fn(),
}));

vi.mock("child_process", () => ({
  execSync: mocked.execSync,
}));

vi.mock("@clack/prompts", () => ({
  log: {
    error: mocked.error,
  },
}));

vi.mock("picocolors", () => ({
  default: {
    red: (value: string) => value,
  },
}));

vi.mock("./args", () => ({
  flags: {
    git_args: "",
  },
}));

describe("ensure_staged_changes", () => {
  beforeEach(() => {
    mocked.error.mockReset();
    mocked.execSync.mockReset();
  });

  it("does not exit when staged changes exist", async () => {
    const { ensure_staged_changes } = await import("./git");
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    mocked.execSync.mockReturnValue(Buffer.from("A  src/git.ts\n"));

    ensure_staged_changes();

    expect(exit).not.toHaveBeenCalled();
    expect(mocked.error).not.toHaveBeenCalled();
  });

  it("exits early when no staged changes exist", async () => {
    const { ensure_staged_changes } = await import("./git");
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    mocked.execSync.mockReturnValue(Buffer.from(" M src/git.ts\n"));

    expect(() => ensure_staged_changes()).toThrow("process.exit");
    expect(mocked.error).toHaveBeenCalledWith(
      'no changes added to commit (use "git add" and/or "git commit -a")',
    );
    expect(exit).toHaveBeenCalledWith(0);
  });
});
