#! /usr/bin/env node

import Configstore from "configstore";
import { chdir } from "process";
import { InferOutput, parse } from "valibot";
import { BranchState, CommitState, Config } from "./valibot-state";
import { load_setup, get_git_root, NOOP_PROMPT_CACHE } from "./utils";
import { flags } from "./args";
import { BranchRunnable } from "./prompts/branch-runnable";
import { BranchCheckoutPrompt } from "./prompts/branch-checkout.prompt";
import { BranchUserPrompt } from "./prompts/branch-user.prompt";
import { BranchTypePrompt } from "./prompts/branch-type.prompt";
import { BranchTicketPrompt } from "./prompts/branch-ticket.prompt";
import { BranchVersionPrompt } from "./prompts/branch-version.prompt";
import { BranchDescriptionPrompt } from "./prompts/branch-description.prompt";
import { BranchConfirmPrompt } from "./prompts/branch-confirm.prompt";
import { branch_flags } from "./branch-args";

main(load_setup(" better-branch "));

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

async function main(config: InferOutput<typeof Config>) {
  chdir(get_git_root());

  const branch_state = parse(BranchState, branch_flags.branch_state);
  const prompt_cache = config.cache_last_value
    ? new Configstore("better-commits")
    : NOOP_PROMPT_CACHE;
  const prompts_to_run = flags.interactive
    ? promptCtors
    : [BranchConfirmPrompt];
  for (const Prompt of prompts_to_run) {
    await new Prompt(config, branch_state, prompt_cache).run();
  }
}

// TODO: No idea what's happening here
// If you don't use CommitState, (even in unreachable code), parse fails on Config
CommitState;
