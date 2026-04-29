import { execSync } from "child_process";
import { InferOutput } from "valibot";
import { flags } from "./args";
import { get_package_version } from "./utils";
import {
  infer_scope_from_git,
  infer_ticket_from_git,
  infer_type_from_git,
} from "./utils/infer";
import { Config } from "./valibot-state";
import color from "picocolors";

const ADDITIONAL_COMMAND_DEFINITIONS: Record<string, string> = {
  "better-branch": "Create a branch or worktree from a guided prompt flow.",
  "better-commits-init":
    "Create a .better-commits.jsonc config in this repository.",
};

const CLI_FLAG_DEFINITIONS: Record<string, string> = {
  "--no-interactive": "Run without tui prompts.",
  "--dry-run": "Print the commit command without creating a commit.",
  "--help": "Show help information and exit.",
};

const COMMIT_FLAG_DEFINITIONS: Record<string, string> = {
  "--type": "Set commit type (can be inferred from branch).",
  "--scope": "Set commit scope (can be inferred from branch).",
  "--title": "Set commit title/description.",
  "--body": "Set commit body text.",
  "--ticket": "Set ticket / issue (can be inferred from branch).",
  "--closes": "Set closes footer (true/false).",
  "--trailer": "Set trailer footer value.",
  "--breaking-title": "Set breaking-change title footer.",
  "--breaking-body": "Set breaking-change body footer.",
  "--deprecates-title": "Set deprecates footer title text.",
  "--deprecates-body": "Set deprecates footer body text.",
  "--custom-footer": "Set a custom footer line.",
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
      execSync(`git ${flags.git_args} branch --show-current`, { stdio: "pipe" })
        .toString()
        .trim() || "(none)";
  } catch {
    // noop
  }

  const inferred_type =
    infer_type_from_git(config.commit_type.options, flags.git_args) ||
    "Unknown";
  const inferred_ticket = config.check_ticket.infer_ticket
    ? infer_ticket_from_git(
        {
          append_hashtag: config.check_ticket.append_hashtag,
          prepend_hashtag: config.check_ticket.prepend_hashtag,
        },
        flags.git_args,
      ) || "Unknown"
    : "Infer Disabled";
  const inferred_scope = config.commit_scope.infer_scope_from_branch
    ? infer_scope_from_git(config.commit_scope.options, flags.git_args) ||
      "Unknown"
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
  const commit_flags = to_definition_lines(COMMIT_FLAG_DEFINITIONS);
  const additional_commands = to_definition_lines(
    ADDITIONAL_COMMAND_DEFINITIONS,
  );

  console.log(`
${color.green(" better-commits")} ${color.gray("v" + version)}

${color.gray("BRANCH")} 
 ${branch}
 ${color.gray("Type")} ${color.blue(inferred_type)} ${color.gray("·")} ${color.gray("Scope")} ${color.cyan(inferred_scope)} ${color.gray("·")} ${color.gray("Ticket")} ${color.magenta(inferred_ticket)}

${color.gray("CONFIGURATION")} 
 ${config_source}

${color.gray("Types")} 
 ${types}

${color.gray("Scopes")} 
 ${scopes}

${color.gray("CLI FLAGS")} 
${cli_flags}

${color.gray("Commit Flags")} 
${commit_flags}

${color.gray("Git Flags (Advanced)")} 
${git_flags}

${color.gray("ADDITIONAL COMMANDS")} 
${additional_commands}

`);
}
