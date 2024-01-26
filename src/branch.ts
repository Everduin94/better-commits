#! /usr/bin/env node

import { CommitState, Config } from "./zod-state";
import {
  BRANCH_ACTION_OPTIONS,
  CACHE_PROMPT,
  load_setup,
  OPTIONAL_PROMPT,
  Z_BRANCH_ACTIONS,
  Z_BRANCH_CONFIG_FIELDS,
  Z_BRANCH_FIELDS,
} from "./utils";
import { BranchState } from "./zod-state";
import * as p from "@clack/prompts";
import Configstore from "configstore";
import { z } from "zod";
import { execSync } from "child_process";
import color from "picocolors";
import { chdir } from "process";

main(load_setup(" better-branch "));

async function main(config: z.infer<typeof Config>) {
  const branch_state = BranchState.parse({});

  let checkout_type: z.infer<typeof Z_BRANCH_ACTIONS> = "branch";
  if (config.enable_worktrees) {
    const branch_or_worktree = await p.select({
      message: `Checkout a branch or create a worktree?`,
      initialValue: config.branch_action_default,
      options: BRANCH_ACTION_OPTIONS,
    });

    if (p.isCancel(branch_or_worktree)) process.exit();
    checkout_type = branch_or_worktree;
  }

  if (config.branch_user.enable) {
    const cache_user_name = get_user_from_cache();
    const user_name_required = config.branch_user.required;
    const user_name = await p.text({
      message: `Type your git username ${
        user_name_required ? "" : OPTIONAL_PROMPT
      } ${CACHE_PROMPT}`.trim(),
      placeholder: "",
      initialValue: cache_user_name,
      validate: (val) => {
        if (user_name_required && !val) return "Please enter a username";
      },
    });
    if (p.isCancel(user_name)) process.exit(0);
    branch_state.user = user_name?.replace(/\s+/g, "-")?.toLowerCase() ?? "";
    set_user_cache(branch_state.user);
  }

  if (config.branch_type.enable) {
    let initial_value = config.commit_type.initial_value;
    const commit_type = await p.select({
      message: `Select a branch type`,
      initialValue: initial_value,
      options: config.commit_type.options,
    });
    if (p.isCancel(commit_type)) process.exit(0);
    branch_state.type = commit_type;
  }

  if (config.branch_ticket.enable) {
    const ticked_required = config.branch_ticket.required;
    const ticket = await p.text({
      message: `Type ticket / issue number ${
        ticked_required ? "" : OPTIONAL_PROMPT
      }`.trim(),
      placeholder: "",
      validate: (val) => {
        if (ticked_required && !val) return "Please enter a ticket / issue";
      },
    });
    if (p.isCancel(ticket)) process.exit(0);
    branch_state.ticket = ticket;
  }

  if (config.branch_version.enable) {
    const version_required = config.branch_version.required;
    const version = await p.text({
      message: `Type version number ${
        version_required ? "" : OPTIONAL_PROMPT
      }`.trim(),
      placeholder: "",
      validate: (val) => {
        if (version_required && !val) return "Please enter a version";
      },
    });
    if (p.isCancel(version)) process.exit(0);
    branch_state.version = version;
  }

  const description_max_length = config.branch_description.max_length;
  const description = await p.text({
    message: "Type a short description",
    placeholder: "",
    validate: (value) => {
      if (!value) return "Please enter a description";
      if (value.length > description_max_length)
        return `Exceeded max length. Description max [${description_max_length}]`;
    },
  });
  if (p.isCancel(description)) process.exit(0);
  branch_state.description =
    description?.replace(/\s+/g, "-")?.toLowerCase() ?? "";

  const pre_commands =
    checkout_type === "worktree"
      ? config.worktree_pre_commands
      : config.branch_pre_commands;
  pre_commands.forEach((command) => {
    try {
      execSync(command, { stdio: "inherit" });
    } catch (err) {
      p.log.error("Something went wrong when executing pre-commands: " + err);
      process.exit(0);
    }
  });

  const branch_name = build_branch(branch_state, config);
  const branch_flag = verify_branch_name(branch_name);
  if (checkout_type === "branch") {
    try {
      execSync(`git checkout ${branch_flag} ${branch_name}`, {
        stdio: "inherit",
      });
      p.log.info(
        `Switched to a new branch '${color.bgGreen(
          " " + color.black(branch_name) + " "
        )}'`
      );
    } catch (err) {
      process.exit(0);
    }
  } else {
    try {
      const ticket = branch_state.ticket ? `${branch_state.ticket}-` : "";
      const worktree_name = `${ticket}${branch_state.description}`;
      execSync(
        `git worktree add ${worktree_name} ${branch_flag} ${branch_name}`,
        {
          stdio: "inherit",
        }
      );
      p.log.info(
        `Created a new worktree ${color.bgGreen(
          +" " + color.black(worktree_name) + " "
        )}, checked out branch ${color.bgGreen(
          " " + color.black(branch_name) + " "
        )}`
      );
      p.log.info(
        color.bgMagenta(color.black(` cd ${worktree_name} `)) +
          " to navigate to your new worktree"
      );
      chdir(worktree_name);
    } catch (err) {
      process.exit(0);
    }
  }

  const post_commands =
    checkout_type === "worktree"
      ? config.worktree_post_commands
      : config.branch_post_commands;
  post_commands.forEach((command) => {
    try {
      execSync(command, { stdio: "inherit" });
    } catch (err) {
      p.log.error("Something went wrong when executing post-commands: " + err);
      process.exit(0);
    }
  });
}

function build_branch(
  branch: z.infer<typeof BranchState>,
  config: z.infer<typeof Config>
) {
  let res = "";
  config.branch_order.forEach((b: z.infer<typeof Z_BRANCH_FIELDS>) => {
    const config_key: z.infer<typeof Z_BRANCH_CONFIG_FIELDS> = `branch_${b}`
     if (branch[b]) res += branch[b] + config[config_key].separator
  })
  if (res.endsWith('-') || res.endsWith('/') || res.endsWith('_')) {
    return res.slice(0, -1).trim();
  }
  return res.trim();
}

function get_user_from_cache(): string {
  try {
    const config_store = new Configstore("better-commits");
    return config_store.get("username") ?? "";
  } catch (err) {
    p.log.warn(
      'There was an issue accessing username from cache. Check that the folder "~/.config" exists'
    );
  }

  return "";
}

function verify_branch_name(branch_name: string): string {
  // TODO: There has to be a better way 🤦
  let branch_flag = "";
  try {
    execSync(`git show-ref ${branch_name}`, { encoding: "utf-8" });
    p.log.warning(
      color.yellow(
        `${branch_name} already exists! Checking out existing branch.`
      )
    );
  } catch (err) {
    // Branch does not exist
    branch_flag = "-b";
  }

  return branch_flag;
}

function set_user_cache(val: string): void {
  try {
    const config_store = new Configstore("better-commits");
    config_store.set("username", val);
  } catch (err) {
    // fail silently, user has likely already seen guidance via get exceptions at this point
  }
}

// TODO: No idea what's happening here
// If you don't use CommitState, (even in unreachable code), parse fails on Config
CommitState;
