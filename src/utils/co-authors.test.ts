import { describe, expect, it } from "vitest";
import {
  format_co_authored_by,
  format_co_author_label,
  join_co_author_trailers,
  normalize_co_author_input,
  normalize_co_author_inputs,
} from "./co-authors";

describe("co-authors", () => {
  it("formats a standard Co-authored-by trailer", () => {
    expect(format_co_authored_by("Jane Doe", "jane@example.com")).toBe(
      "Co-authored-by: Jane Doe <jane@example.com>",
    );
  });

  it("formats a label for prompts", () => {
    expect(
      format_co_author_label({ name: "Jane Doe", email: "jane@example.com" }),
    ).toBe("Jane Doe <jane@example.com>");
  });

  it("normalizes Name <email> input", () => {
    expect(normalize_co_author_input("Jane Doe <jane@example.com>")).toBe(
      "Co-authored-by: Jane Doe <jane@example.com>",
    );
  });

  it("normalizes an already-prefixed trailer", () => {
    expect(
      normalize_co_author_input(
        "Co-authored-by: Jane Doe <jane@example.com>",
      ),
    ).toBe("Co-authored-by: Jane Doe <jane@example.com>");
  });

  it("returns null for invalid input", () => {
    expect(normalize_co_author_input("")).toBeNull();
    expect(normalize_co_author_input("Jane Doe")).toBeNull();
    expect(normalize_co_author_input("<>")).toBeNull();
  });

  it("deduplicates normalized inputs", () => {
    expect(
      normalize_co_author_inputs([
        "Jane Doe <jane@example.com>",
        "Co-authored-by: Jane Doe <jane@example.com>",
        "Alex <alex@example.com>",
      ]),
    ).toEqual([
      "Co-authored-by: Jane Doe <jane@example.com>",
      "Co-authored-by: Alex <alex@example.com>",
    ]);
  });

  it("joins trailers with newlines", () => {
    expect(
      join_co_author_trailers([
        "Co-authored-by: Jane Doe <jane@example.com>",
        "Co-authored-by: Alex <alex@example.com>",
      ]),
    ).toBe(
      "Co-authored-by: Jane Doe <jane@example.com>\nCo-authored-by: Alex <alex@example.com>",
    );
  });
});
