#! /usr/bin/env node

import Configstore from "configstore";
import { chdir } from "process";
import { InferOutput, ValiError, parse } from "valibot";
import { BranchState, CommitState, Config } from "./valibot-state";
import { load_setup, get_git_root, NOOP_PROMPT_CACHE } from "./utils";
import { BranchRunnable } from "./prompts/branch-runnable";
import { BranchCheckoutPrompt } from "./prompts/branch-checkout.prompt";
import { BranchUserPrompt } from "./prompts/branch-user.prompt";
import { BranchTypePrompt } from "./prompts/branch-type.prompt";
import { BranchTicketPrompt } from "./prompts/branch-ticket.prompt";
import { BranchVersionPrompt } from "./prompts/branch-version.prompt";
import { BranchDescriptionPrompt } from "./prompts/branch-description.prompt";
import { BranchConfirmPrompt } from "./prompts/branch-confirm.prompt";
import { branch_flags } from "./branch-args";
import { create_strict_branch_state } from "./utils/no-interactive-validation";
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
  BranchVersionPrompt,
  BranchDescriptionPrompt,
  BranchConfirmPrompt,
];

main(load_setup(" better-branch "));

async function main(config: InferOutput<typeof Config>) {
  chdir(get_git_root());

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
