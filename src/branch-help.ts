import { execSync } from "child_process";
import { InferOutput } from "valibot";
import { branch_flags } from "./branch-args";
import { get_package_version } from "./utils";
import { infer_ticket_from_git, infer_type_from_git } from "./utils/infer";
import { Config } from "./valibot-state";
import color from "picocolors";

const CLI_FLAG_DEFINITIONS: Record<string, string> = {
  "--interactive": "Run in interactive prompt mode (default behavior).",
  "--dry-run": "Print branch commands without creating a branch or worktree.",
  "--help": "Show help information and exit.",
};

const BRANCH_FLAG_DEFINITIONS: Record<string, string> = {
  "--user": "Set branch username segment.",
  "--type": "Set branch type (for example feat, fix, docs).",
  "--description": "Set branch description segment.",
  "--ticket": "Set branch ticket/issue segment.",
  "--branch-version": "Set branch version segment.",
  "--checkout": "Choose branch or worktree checkout mode.",
};

const GIT_FLAG_DEFINITIONS: Record<string, string> = {
  "--git-dir": "Set the path to the .git directory.",
  "--work-tree": "Set the path to the working tree root.",
};

function to_definition_lines(definitions: Record<string, string>): string {
  const description_column = 26;
  const minimum_spacing = 2;
  const indent = " ";

  return Object.entries(definitions)
    .map(([name, description]) => {
      const spaces = Math.max(
        minimum_spacing,
        description_column - name.length,
      );
      return `${indent}${name}${" ".repeat(spaces)}${description}`;
    })
    .join("\n");
}

export function print_help_text(
  config: InferOutput<typeof Config>,
  config_source: "repository" | "global" | "none",
) {
  const version = get_package_version();

  let branch = "(none)";
  try {
    branch =
      execSync(`git ${branch_flags.git_args} branch --show-current`, {
        stdio: "pipe",
      })
        .toString()
        .trim() || "(none)";
  } catch {
    // noop
  }

  const inferred_type =
    infer_type_from_git(config.commit_type.options, branch_flags.git_args) ||
    "Unknown";
  const inferred_ticket = config.check_ticket.infer_ticket
    ? infer_ticket_from_git(
        {
          append_hashtag: config.check_ticket.append_hashtag,
          prepend_hashtag: config.check_ticket.prepend_hashtag,
        },
        branch_flags.git_args,
      ) || "Unknown"
    : "Infer Disabled";

  const types = config.commit_type.options
    .map((option) => option.value)
    .join(", ")
    .trim();
  const scopes = config.commit_scope.options
    .map((option) => option.value)
    .join(", ")
    .trim();
  const cli_flags = to_definition_lines(CLI_FLAG_DEFINITIONS);
  const git_flags = to_definition_lines(GIT_FLAG_DEFINITIONS);
  const branch_flags_help = to_definition_lines(BRANCH_FLAG_DEFINITIONS);

  console.log(`
${color.green(" better-branch")} ${color.gray("v" + version)}

${color.gray("BRANCH")} 
 ${branch}
 ${color.gray("Type")} ${color.blue(inferred_type)} ${color.gray("·")} ${color.gray("Ticket")} ${color.magenta(inferred_ticket)}

${color.gray("CONFIGURATION")} 
 ${config_source}

${color.gray("Types")} 
 ${types}

${color.gray("Scopes")} 
 ${scopes}

${color.gray("CLI FLAGS")} 
${cli_flags}

${color.gray("Branch Flags")} 
${branch_flags_help}

${color.gray("Git Flags (Advanced)")} 
${git_flags}

`);
}
