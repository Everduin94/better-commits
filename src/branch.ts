#! /usr/bin/env node

import { CommitState, Config } from "./zod-state";
import {
  CACHE_PROMPT,
  get_git_root,
  load_setup,
  OPTIONAL_PROMPT,
} from "./utils";
import simpleGit from "simple-git";
import { BranchState } from "./zod-state";
import * as p from "@clack/prompts";
import Configstore from "configstore";
import { z } from "zod";
import { execSync } from "child_process";

main(load_setup(" better-branch "));

async function main(config: z.infer<typeof Config>) {
  const branch_state = BranchState.parse({});

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

  config.branch_pre_commands.forEach((command) => {
    try {
      execSync(command, { stdio: "inherit" });
    } catch (err) {
      p.log.error("Something went wrong when executing pre-commands: " + err);
      process.exit(0);
    }
  });

  const branch_name = build_branch(branch_state, config);
  const simple_git = simpleGit({ baseDir: get_git_root() });
  await simple_git.checkoutLocalBranch(branch_name);

  p.log.info(`Switched to a new branch '${branch_name}'`);

  config.branch_post_commands.forEach((command) => {
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
  if (branch.user) res += branch.user + config.branch_user.separator;
  if (branch.type) res += branch.type + config.branch_type.separator;
  if (branch.ticket) res += branch.ticket + config.branch_ticket.separator;
  if (branch.description) res += branch.description;
  return res;
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
