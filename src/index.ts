#! /usr/bin/env node

import { chdir } from "process";
import * as p from "@clack/prompts";
import { Input, Output, ValiError, parse } from "valibot";
import { CommitState, Config } from "./valibot-state";
import { load_setup, get_git_root, NOOP_PROMPT_CACHE } from "./utils";
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
import { infer_ticket_from_git, infer_type_from_git } from "./utils/infer";

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

// TODO: Hypothetically, we could just do this, then remove code from prompts?
function infer_not_interactive(config: Output<typeof Config>) {
  if (flags.interactive) return;

  let inferred_state = { ticket: "", type: "" };

  if (config.check_ticket.infer_ticket) {
    const inferred_ticket = infer_ticket_from_git(
      {
        append_hashtag: config.check_ticket.append_hashtag,
        prepend_hashtag: config.check_ticket.prepend_hashtag,
      },
      flags.git_args,
    );
    inferred_state.ticket = inferred_ticket;
  }

  const inferred_type = infer_type_from_git(
    config.commit_type.options,
    flags.git_args,
  );
  inferred_state.type = inferred_type;

  return inferred_state;
}

export async function main(config: Output<typeof Config>) {
  chdir(get_git_root());

  const infer_state = infer_not_interactive(config);
  const flags_plus_infer: Input<typeof CommitState> = {
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
