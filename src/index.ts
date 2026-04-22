#! /usr/bin/env node

import fs from "fs";
import { chdir } from "process";
import * as p from "@clack/prompts";
import { InferInput, InferOutput, ValiError, parse } from "valibot";
import { CommitState, Config } from "./valibot-state";
import {
  CONFIG_FILE_NAME,
  load_setup,
  get_default_config_path,
  get_git_root,
  NOOP_PROMPT_CACHE,
} from "./utils";
import { create_strict_commit_state } from "./utils/no-interactive-validation";
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
import { flags } from "./args";
import { infer_not_interactive } from "./utils/infer";
import { print_help_text } from "./help";

type PromptCtor = new (
  config: InferOutput<typeof Config>,
  commit_state: InferOutput<typeof CommitState>,
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

const root = get_git_root();
const has_repo_config = fs.existsSync(`${root}/${CONFIG_FILE_NAME}`);
const has_global_config = fs.existsSync(get_default_config_path());
const config_source = has_repo_config
  ? "repository"
  : has_global_config
    ? "global"
    : "none";

main(load_setup(), config_source);

export async function main(
  config: InferOutput<typeof Config>,
  config_source: "repository" | "global" | "none",
) {
  chdir(get_git_root());

  if (flags.help) {
    print_help_text(config, config_source);
    return;
  }

  const infer_state = infer_not_interactive(config);
  const flags_plus_infer: InferInput<typeof CommitState> = {
    ...flags.commit_state,
    type: (flags.commit_state.type || infer_state?.type) ?? "",
    ticket: (flags.commit_state.ticket || infer_state?.ticket) ?? "",
  };

  const commit_state = parse(CommitState, flags_plus_infer);

  if (!flags.interactive) {
    try {
      parse(create_strict_commit_state(config), commit_state);
    } catch (err) {
      if (err instanceof ValiError) {
        p.log.error(`Invalid --no-interactive commit input: ${err.message}`);
      } else {
        p.log.error(`Failed to validate --no-interactive commit input: ${err}`);
      }
      process.exit(0);
    }
  }

  const prompt_cache = config.cache_last_value
    ? new Configstore("better-commits")
    : NOOP_PROMPT_CACHE;

  const prompts_to_run = flags.interactive
    ? promptCtors
    : [CommitConfirmPrompt];

  for (const Prompt of prompts_to_run) {
    await new Prompt(config, commit_state, prompt_cache).run();
  }
}
