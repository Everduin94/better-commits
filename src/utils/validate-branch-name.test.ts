import { describe, expect, it } from "vitest";
import { validate_branch_name } from "./validate-branch-name";

describe("validate_branch_name", () => {
  it("accepts valid branch names", () => {
    expect(validate_branch_name("feat/TAC-123-safe-branch")).toBeUndefined();
  });

  it.each(["feat/a..b", "feat/done.", "feat/x:y"])(
    "rejects %s",
    (branch_name) => {
      expect(validate_branch_name(branch_name)).toContain(
        "is not a valid branch name",
      );
    },
  );

  it("rejects branch shorthand", () => {
    expect(validate_branch_name("@{-1}")).toBeDefined();
  });
});
