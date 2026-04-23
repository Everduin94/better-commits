#! /usr/bin/env node

import { chdir } from "process";
import * as p from "@clack/prompts";
import { InferInput, InferOutput, ValiError, parse } from "valibot";
import { CommitState, Config } from "./valibot-state";
import {
  load_setup,
  get_git_root,
  NOOP_PROMPT_CACHE,
  ConfigSource,
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
import { get_package_version } from "./utils";
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

const { config, config_source } = load_setup();

main(config, config_source);

export async function main(
  config: InferOutput<typeof Config>,
  config_source: ConfigSource,
) {
  chdir(get_git_root());

  if (flags.version) {
    const version = get_package_version();
    p.log.step("Better Commits v" + version);
    return;
  }

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
