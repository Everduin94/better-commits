#! /usr/bin/env node

import Configstore from "configstore";
import { chdir } from "process";
import { InferOutput, ValiError, parse } from "valibot";
import { BranchState, CommitState, Config } from "./valibot-state";
import {
  load_setup,
  get_git_root,
  NOOP_PROMPT_CACHE,
  ConfigSource,
} from "./utils";
import { BranchRunnable } from "./prompts/branch-runnable";
import { BranchCheckoutPrompt } from "./prompts/branch-checkout.prompt";
import { BranchUserPrompt } from "./prompts/branch-user.prompt";
import { BranchTypePrompt } from "./prompts/branch-type.prompt";
import { BranchScopePrompt } from "./prompts/branch-scope.prompt";
import { BranchTicketPrompt } from "./prompts/branch-ticket.prompt";
import { BranchVersionPrompt } from "./prompts/branch-version.prompt";
import { BranchDescriptionPrompt } from "./prompts/branch-description.prompt";
import { BranchConfirmPrompt } from "./prompts/branch-confirm.prompt";
import { branch_flags } from "./branch-args";
import { print_help_text } from "./branch-help";
import { create_strict_branch_state } from "./utils/no-interactive-validation";
import { get_package_version } from "./utils";
import * as p from "@clack/prompts";

type PromptCtor = new (
  config: InferOutput<typeof Config>,
  commit_state: InferOutput<typeof BranchState>,
  prompt_cache: Configstore,
) => BranchRunnable;

const promptCtors: PromptCtor[] = [
  BranchCheckoutPrompt,
  BranchUserPrompt,
  BranchTypePrompt,
  BranchTicketPrompt,
  BranchScopePrompt,
  BranchVersionPrompt,
  BranchDescriptionPrompt,
  BranchConfirmPrompt,
];

const { config, config_source } = load_setup(
  " better-branch ",
  branch_flags.git_args,
);

main(config, config_source);

async function main(
  config: InferOutput<typeof Config>,
  config_source: ConfigSource,
) {
  chdir(get_git_root(branch_flags.git_args));

  if (branch_flags.version) {
    const version = get_package_version();
    p.log.step("Better Commits v" + version);
    return;
  }

  if (branch_flags.help) {
    print_help_text(config, config_source);
    return;
  }

  const branch_state = parse(BranchState, branch_flags.branch_state);

  if (!branch_flags.interactive) {
    try {
      parse(create_strict_branch_state(config), branch_state);
    } catch (err) {
      if (err instanceof ValiError) {
        p.log.error(`Invalid branch input: ${err.message}`);
      } else {
        p.log.error(`Failed to validate branch input: ${err}`);
      }
      process.exit(0);
    }
  }

  const prompt_cache = config.cache_last_value
    ? new Configstore("better-commits")
    : NOOP_PROMPT_CACHE;
  const prompts_to_run = branch_flags.interactive
    ? promptCtors
    : [BranchConfirmPrompt];
  for (const Prompt of prompts_to_run) {
    await new Prompt(config, branch_state, prompt_cache).run();
  }
}

// TODO: No idea what's happening here
// If you don't use CommitState, (even in unreachable code), parse fails on Config
CommitState;
