#! /usr/bin/env node

import { CommitState, Config } from "./zod-state";
import { CACHE_PROMPT, get_git_root, load_setup, OPTIONAL_PROMPT } from "./utils";
import simpleGit from "simple-git";
import { BranchState } from "./zod-state";
import * as p from '@clack/prompts';
import Configstore from 'configstore';
import { z } from "zod";
import { execSync } from "child_process";

main(load_setup())

async function main(config: z.infer<typeof Config>) {
    const config_store = new Configstore('better-commits');

    const branch_state = BranchState.parse({});
    const simple_git = simpleGit({ baseDir: get_git_root() })
    const user_name_required = config.branch_user.required
    const user_name = await p.text({
      message: `Type your git username ${user_name_required ? '' : OPTIONAL_PROMPT} ${CACHE_PROMPT}`.trim(),
      placeholder: '',
      initialValue: config_store.get('username') ?? '',
    })
    if (p.isCancel(user_name)) process.exit(0)
    branch_state.user = user_name.replace(/\s+/g, '-').toLowerCase();
    config_store.set('username', branch_state.user)

    if (config.commit_type.enable) {
      let initial_value = config.commit_type.initial_value 
      const commit_type = await p.select(
          {
            message: `Select a commit type`,
            initialValue: initial_value,
            options: config.commit_type.options,
          }
      )
      if (p.isCancel(commit_type)) process.exit(0)
      branch_state.type = commit_type;
    }

    const ticket = await p.text({
      message: `Type ticket / issue number ${config.branch_ticket.required ? '' : OPTIONAL_PROMPT}`.trim(),
      placeholder: '',
    })
    if (p.isCancel(ticket)) process.exit(0)
    branch_state.ticket = ticket;


    const description_max_length = config.branch_description.max_length
    const description = await p.text({
      message: 'Type a short description',
      placeholder: '',
      validate: (value) => {
        if (!value) return 'Please enter a description'
        if (value.length > description_max_length) return `Exceeded max length. Description max [${description_max_length}]`
      }
    })
    if (p.isCancel(description)) process.exit(0)
    branch_state.description = description.replace(/\s+/g, '-').toLowerCase();

    config.branch_pre_commands.forEach(command => {
      try {
        const output = execSync(command).toString().trim();
        p.log.info(output)
      } catch (err) {
        p.log.error('Something went wrong when executing pre-commands: ' + err);
        process.exit(0)
      }
    })

    await simple_git.checkoutLocalBranch(build_branch(branch_state, config))

    config.branch_post_commands.forEach(command => {
      try {
        const output = execSync(command).toString().trim();
        p.log.info(output)
      } catch (err) {
        p.log.error('Something went wrong when executing post-commands: ' + err);
        process.exit(0)
      }
    })

}

function build_branch(branch: z.infer<typeof BranchState>, config: z.infer<typeof Config>) {
  let res = ''
  if (branch.user) res += branch.user + config.branch_user.separator
  if (branch.type) res += branch.type + config.branch_type.separator
  if (branch.ticket) res += branch.ticket + config.branch_ticket.separator
  if (branch.description) res+= branch.description
  return res;
}


// TODO: I have no idea what's happening here
// If you don't use CommitState, (even in unreachable code), parse fails on Config
CommitState
