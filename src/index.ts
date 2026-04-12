#! /usr/bin/env node

import { chdir } from "process";
import { Output, parse } from "valibot";
import { CommitState, Config } from "./valibot-state";
import { load_setup, get_git_root, NOOP_PROMPT_CACHE } from "./utils";
import Configstore from "configstore";
import { CommitTypePrompt } from "./prompts/commit-type.prompt";
import { Runnable } from "./prompts/runnable";
import { CommitScopePrompt } from "./prompts/commit-scope.prompt";
import { CommitTicketPrompt } from "./prompts/commit-ticket.prompt";
import { CommitTitlePrompt } from "./prompts/commit-title.prompt";
import { CommitBodyPrompt } from "./prompts/commit-body.prompt";
import { CommitFooterPrompt } from "./prompts/commit-footer.prompt";
import { CommitConfirmPrompt } from "./prompts/commit-confirm.prompt";
import { CommitStatusPrompt } from "./prompts/commit-status.prompt";

type PromptCtor = new (
  config: Output<typeof Config>,
  commit_state: Output<typeof CommitState>,
  prompt_cache: Configstore,
) => Runnable;

const promptCtors: PromptCtor[] = [
  CommitStatusPrompt,
  CommitTypePrompt,
  CommitScopePrompt,
  CommitTicketPrompt,
  CommitTitlePrompt,
  CommitBodyPrompt,
  CommitFooterPrompt,
  CommitConfirmPrompt,
];

main(load_setup());

export async function main(config: Output<typeof Config>) {
  chdir(get_git_root());
  const commit_state = parse(CommitState, {});
  const prompt_cache = config.cache_last_value
    ? new Configstore("better-commits")
    : NOOP_PROMPT_CACHE;

  for (const Prompt of promptCtors) {
    await new Prompt(config, commit_state, prompt_cache).run();
  }
}
