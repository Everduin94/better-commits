#! /usr/bin/env node

import * as p from '@clack/prompts';
import color from 'picocolors';
import { simpleGit } from "simple-git"
import fs from 'fs'
import { execSync } from 'child_process';
import { z } from "zod";
import { fromZodError } from 'zod-validation-error';
import { CommitState, Config } from './zod-state';
import { CONFIG_FILE_NAME, get_default_config_path, check_missing_stage, addNewLine, SPACE_TO_SELECT, REGEX_SLASH_TAG, REGEX_SLASH_NUM, REGEX_START_TAG, REGEX_START_NUM, OPTIONAL_PROMPT, clean_commit_title, COMMIT_FOOTER_OPTIONS, infer_type_from_branch } from './utils';


main(load_setup());

function load_setup(): z.infer<typeof Config> {

  console.clear();
  p.intro(`${color.bgCyan(color.black(' better-commits '))}`);

  const root = execSync('git rev-parse --show-toplevel').toString().trim();
  const root_path = `${root}/${CONFIG_FILE_NAME}`
  if (fs.existsSync(root_path)) {
    p.log.step('Found repository config')
    return read_config_from_path(root_path)
  }

  const home_path = get_default_config_path();
  if (fs.existsSync(home_path)) {
    p.log.step('Found global config')
    return read_config_from_path(home_path);
  } 

  const default_config = Config.parse({})
  p.log.step('Config not found. Generating default .better-commit.json at $HOME')
  fs.writeFileSync(home_path, JSON.stringify(default_config, null, '\t'));
  return default_config;

}

function read_config_from_path(config_path: string) {
  let res = null;
  try {
    res = JSON.parse(fs.readFileSync(config_path, 'utf8'))
  } catch (err) {
    p.log.error('Invalid JSON file. Exiting.\n' + err)
    process.exit(0);
  }

  return validate_config(res);
}

function validate_config(config: z.infer<typeof Config>): z.infer<typeof Config> {
  try {
    return Config.parse(config)
  } catch (err: any) {
    console.log(fromZodError(err).message);
    process.exit(0)
  }
}

async function main(config: z.infer<typeof Config>) {
  let commit_state = CommitState.parse({})
  let git_status = await simpleGit().status();
  if (config.check_status) {
    p.log.step(color.black(color.bgGreen(' Checking Git Status ')))
    const missing_files = check_missing_stage(git_status);
    const staged_files = git_status.staged.reduce((acc,curr,i: number) => color.green(acc+curr+addNewLine(git_status.staged,i)), '');
    p.log.success('Changes to be committed:\n'+staged_files)
    if (missing_files.length) {
    const unstaged_files = missing_files.reduce((acc,curr,i: number) => color.red(acc+curr+addNewLine(missing_files,i)), '');
     p.log.error('Changes not staged for commit:\n'+unstaged_files)
     const selected_for_staging = await p.multiselect({
       message: `Some files have not been staged, would you like to add them now? ${SPACE_TO_SELECT}`,
       options: [{value: '.', label: '.'}, ...missing_files.map(v => ({value: v, label: v}))],
       required: false,
     }) as string[]
    if (p.isCancel(selected_for_staging)) process.exit(0)

     await simpleGit().add(selected_for_staging)
     git_status = await simpleGit().status();
     if (selected_for_staging?.length){
        p.log.success(color.green('Changes successfully staged'))    
     }
    }
  } 

  if (!git_status.staged.length) {
    p.log.error(color.red('no changes added to commit (use "git add" and/or "git commit -a")'))
    process.exit(0);
  }

  if (config.commit_type.enable) {
    let initial_value = config.commit_type.initial_value 
    if (config.commit_type.infer_type_from_branch) {
      const options = config.commit_type.options.map(o => o.value)
      const type_from_branch = infer_type_from_branch(options)
      if (type_from_branch) initial_value = type_from_branch
    }
    const commit_type = await p.select(
        {
          message: `Select a commit type`,
          initialValue: initial_value,
          options: config.commit_type.options,
        }
    ) as string
    if (p.isCancel(commit_type)) process.exit(0)
    commit_state.type = commit_type;
  }

  if (config.commit_scope.enable) {
   const commit_scope = await p.select({
      message: 'Select a commit scope',
      initialValue: config.commit_scope.initial_value,
      options: config.commit_scope.options
    }) as string
    if (p.isCancel(commit_scope)) process.exit(0)
    commit_state.scope = commit_scope;
  }

  if (config.check_ticket.infer_ticket) {
    try {
      const branch = execSync('git branch --show-current', {stdio : 'pipe' }).toString();
      const found: string[] = [branch.match(REGEX_SLASH_TAG), branch.match(REGEX_SLASH_NUM) , branch.match(REGEX_START_TAG), branch.match(REGEX_START_NUM)]
      .filter(v => v != null)
      .map(v => v && v.length >= 2 ?  v[1] : '')
      if (found.length && found[0]) {
        commit_state.ticket = config.check_ticket.append_hashtag ? '#' + found[0] : found[0]
      }
    } catch(err: any) {
      // Can't find branch, fail silently
    }
  }
  if (config.check_ticket.confirm_ticket) {
    const user_commit_ticket = await p.text({
      message: commit_state.ticket ?  'Ticket / issue infered from branch (confirm / edit)': `Add ticket / issue ${OPTIONAL_PROMPT}`,
      initialValue: commit_state.ticket,
    }) as string
    if (p.isCancel(user_commit_ticket)) process.exit(0)
    // TODO: Symbol can be null. Would be ideal if it just returned empty string. 
    // Seems like a bug that it only returns undefined if previously set.
    commit_state.ticket = user_commit_ticket ?? '';
  }

  const commit_title = await p.text(
      {
					message: 'Write a brief title describing the commit',
					placeholder: '',
					validate: (value) => {
						if (!value) return 'Please enter a title';
            const commit_scope_size = commit_state.scope ? commit_state.scope.length + 2 : 0
            const commit_type_size = commit_state.type.length;
            const commit_ticket_size = config.check_ticket.add_to_title ? commit_state.ticket.length : 0
						if (commit_scope_size + commit_type_size + commit_ticket_size + value.length > config.commit_title.max_size) return `Exceeded max length. Title max [${config.commit_title.max_size}]`;
					},
          
      }
  ) as string

  if (p.isCancel(commit_title)) process.exit(0)
  commit_state.title = clean_commit_title(commit_title);

  if (config.commit_body.enable) {
    const commit_body = await p.text({
            message: `Write a detailed description of the changes ${OPTIONAL_PROMPT}`,
            placeholder: '',
            validate: (val) => {
              if (config.commit_body.required && !val) return 'Please enter a description' 
            }
        
    }) as string
    if (p.isCancel(commit_body)) process.exit(0)
    commit_state.body = commit_body;
  }

  // TODO: Fix type -- should be able to infer?
  if (config.commit_footer.enable) {
    const commit_footer = await p.multiselect({
            message: `Select optional footers ${SPACE_TO_SELECT}`,
            initialValues: config.commit_footer.initial_value,
            options: COMMIT_FOOTER_OPTIONS as {value: "deprecated" | "breaking-change" | "closes", label: string, hint: string}[],
            required: false
    }) as ("deprecated" | "breaking-change" | "closes")[]

    if (commit_footer?.includes('breaking-change')) {
      const breaking_changes_title = await p.text({
              message: 'Breaking changes: Write a short title / summary',
              placeholder: '',
              validate: (value) => {
                if (!value) return 'Please enter a title / summary'
              }
      }) as string
      const breaking_changes_body = await p.text({
              message: `Breaking Changes: Write a description & migration instructions ${OPTIONAL_PROMPT}`,
              placeholder: '',
      }) as string
      commit_state.breaking_title = breaking_changes_title;
      commit_state.breaking_body = breaking_changes_body;
    }

    if (commit_footer?.includes('deprecated')) {
      const deprecated_title = await p.text({
              message: 'Deprecated: Write a short title / summary',
              placeholder: '',
              validate: (value) => {
                if (!value) return 'Please enter a title / summary'
              }
      }) as string
      const deprecated_body = await p.text({
              message: `Deprecated: Write a description ${OPTIONAL_PROMPT}`,
              placeholder: '',
      }) as string
      commit_state.deprecates_body = deprecated_body;
      commit_state.deprecates_title = deprecated_title;
    }

    if (commit_footer?.includes('closes')) {
      commit_state.closes = 'Closes:'
    }
  }
  

  let continue_commit = true;
  p.note(build_commit_string(commit_state, config, true), 'Commit Preview')
  if (config.confirm_commit) {
    continue_commit = await p.confirm({message: 'Confirm Commit?'}) as boolean;
    if (p.isCancel(continue_commit)) process.exit(0)
  }

  if (continue_commit) simpleGit().commit(build_commit_string(commit_state, config, false))
}

function build_commit_string(commit_state: z.infer<typeof CommitState>, config: z.infer<typeof Config>, colorize: boolean = false): string {
  let commit_string = '';
  if (commit_state.type) {
    commit_string += colorize ? color.blue(commit_state.type) : commit_state.type
  } 

  if (commit_state.scope) {
    const scope = colorize ? color.cyan(commit_state.scope) : commit_state.scope;
    commit_string += `(${scope})`
  }

  if (commit_state.breaking_title && config.breaking_change.add_exclamation_to_title) {
    commit_string += colorize ? color.red('!') : '!'
  }

  if (commit_state.scope || commit_state.type) {
     commit_string += ': '
  }

  if (commit_state.ticket) {
     commit_string += colorize ? color.magenta(commit_state.ticket) + ' ' : commit_state.ticket + ' '
  }

  if (commit_state.title) {
    commit_string += colorize ? color.reset(commit_state.title) : commit_state.title;
  }

  if (commit_state.body) {
    const temp = commit_state.body.split('\\n') // literal \n, not new-line.
    const res = temp.map(v => colorize ? color.reset(v.trim()) : v.trim()).join('\n')
    commit_string += colorize ? `\n\n${res}` : `\n\n${res}`;
  }

  if (commit_state.breaking_title) {
    const title = colorize ? color.red(`BREAKING CHANGE: ${commit_state.breaking_title}`) : `BREAKING CHANGE: ${commit_state.breaking_title}`;
    commit_string += `\n\n${title}`
  }

  if (commit_state.breaking_body) {
    const body = colorize ? color.red(commit_state.breaking_body) : commit_state.breaking_body;
    commit_string += `\n\n${body}`
  }

  if (commit_state.deprecates_title) {
    const title = colorize ? color.yellow(`DEPRECATED: ${commit_state.deprecates_title}`) : `DEPRECATED: ${commit_state.deprecates_title}`;
    commit_string += `\n\n${title}`
  }

  if (commit_state.deprecates_body) {
    const body = colorize ? color.yellow(commit_state.deprecates_body) : commit_state.deprecates_body;
    commit_string += `\n\n${body}`
  }

  if (commit_state.closes && commit_state.ticket) {
    commit_string += colorize ? `\n\n${color.reset(commit_state.closes)} ${color.magenta(commit_state.ticket)}` : `\n\n${commit_state.closes} ${commit_state.ticket}`;
  }

  return commit_string;
}

