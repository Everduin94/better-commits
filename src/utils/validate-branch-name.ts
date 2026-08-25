import { spawnSync } from "child_process";

export function validate_branch_name(
  branch_name: string | undefined,
): string | undefined {
  if (!branch_name) return;

  const result = spawnSync(
    "git",
    ["check-ref-format", "--branch", branch_name],
    { encoding: "utf8" },
  );

  if (result.status === 0 && result.stdout?.trim() === branch_name) return;

  const error =
    result.stderr?.trim().replace(/^fatal:\s*/, "") ||
    result.error?.message ||
    `'${branch_name}' is not a valid branch name`;

  return `${error} [git-check-ref-format]`;
}
