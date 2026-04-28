import { InferOutput } from "valibot";
import { V_BRANCH_CONFIG_FIELDS, V_BRANCH_FIELDS } from "../valibot-consts";
import { BranchState, Config } from "../valibot-state";

export function build_branch(
  branch: InferOutput<typeof BranchState>,
  config: InferOutput<typeof Config>,
): string {
  let res = "";
  config.branch_order.forEach((b: InferOutput<typeof V_BRANCH_FIELDS>) => {
    const config_key: InferOutput<typeof V_BRANCH_CONFIG_FIELDS> =
      `branch_${b}`;
    if (branch[b]) res += branch[b] + config[config_key].separator;
  });

  if (res.endsWith("-") || res.endsWith("/") || res.endsWith("_")) {
    return res.slice(0, -1).trim();
  }

  return res.trim();
}

export function build_worktree_path(
  branch_state: InferOutput<typeof BranchState>,
  config: InferOutput<typeof Config>,
  git_root: string,
): string {
  const repo_name = git_root.split("/").pop() || "repo";

  let worktree_name = config.worktrees.folder_template;

  worktree_name = worktree_name
    .replace("{{repo_name}}", repo_name)
    .replace("{{branch_description}}", branch_state.description)
    .replace("{{user}}", branch_state.user || "")
    .replace("{{type}}", branch_state.type || "")
    .replace("{{scope}}", branch_state.scope || "")
    .replace("{{ticket}}", branch_state.ticket || "")
    .replace("{{version}}", branch_state.version || "");

  worktree_name = worktree_name
    .replace(/\s/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

  const base_path = config.worktrees.base_path;
  return `${base_path}${base_path.endsWith("/") ? "" : "/"}${worktree_name}`;
}
