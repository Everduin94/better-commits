import { describe, expect, it } from "vitest";
import {
  format_commit_title_remaining,
  get_commit_title_remaining,
  get_commit_title_size,
} from "./commit-title-size";

describe("get_commit_title_size", () => {
  it("counts type, scope parentheses, optional ticket, and title", () => {
    expect(
      get_commit_title_size(
        { type: "feat", scope: "cli", ticket: "ABC-1", title: "add parser" },
        { include_ticket: true },
      ),
    ).toBe("feat".length + "cli".length + 2 + "ABC-1".length + "add parser".length);

    expect(
      get_commit_title_size(
        { type: "feat", scope: "cli", ticket: "ABC-1", title: "add parser" },
        { include_ticket: false },
      ),
    ).toBe("feat".length + "cli".length + 2 + "add parser".length);
  });

  it("treats missing parts as zero width", () => {
    expect(get_commit_title_size({}, { include_ticket: true })).toBe(0);
    expect(
      get_commit_title_size({ title: "hi" }, { include_ticket: true }),
    ).toBe(2);
  });
});

describe("get_commit_title_remaining", () => {
  it("subtracts current size from max_size", () => {
    expect(
      get_commit_title_remaining(
        { type: "feat", title: "x" },
        { include_ticket: false, max_size: 10 },
      ),
    ).toBe(5);
  });

  it("goes negative when over the limit", () => {
    expect(
      get_commit_title_remaining(
        { type: "feat", title: "too-long-title" },
        { include_ticket: false, max_size: 10 },
      ),
    ).toBeLessThan(0);
  });
});

describe("format_commit_title_remaining", () => {
  it("formats remaining and over-limit copy", () => {
    expect(format_commit_title_remaining(0)).toBe("0 characters remaining");
    expect(format_commit_title_remaining(1)).toBe("1 character remaining");
    expect(format_commit_title_remaining(12)).toBe("12 characters remaining");
    expect(format_commit_title_remaining(-1)).toBe("1 character over limit");
    expect(format_commit_title_remaining(-3)).toBe("3 characters over limit");
  });
});
