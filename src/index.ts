#! /usr/bin/env node

import * as p from '@clack/prompts';
import color from 'picocolors';
import { execSync } from 'child_process';
import { chdir } from "process";
import { z } from "zod";
import { CommitState, Config } from './zod-state';
import { load_setup,  addNewLine, SPACE_TO_SELECT, REGEX_SLASH_TAG, REGEX_SLASH_NUM, REGEX_START_TAG, REGEX_START_NUM, OPTIONAL_PROMPT, clean_commit_title, COMMIT_FOOTER_OPTIONS, infer_type_from_branch, Z_FOOTER_OPTIONS, CUSTOM_SCOPE_KEY,  get_git_root, REGEX_SLASH_UND, REGEX_START_UND } from './utils';
import { git_add, git_status } from './git';

main(load_setup());

export async function main(config: z.infer<typeof Config>) {
  let commit_state = CommitState.parse({})
  chdir(get_git_root());

  if (config.check_status) {
    let {index, work_tree} = git_status() 
    p.log.step(color.black(color.bgGreen(' Checking Git Status ')))
    const staged_files = index.reduce((acc,curr,i: number) => color.green(acc+curr+addNewLine(index,i)), '');
    p.log.success('Changes to be committed:\n'+staged_files)
    if (work_tree.length) {
    const unstaged_files = work_tree.reduce((acc,curr,i: number) => color.red(acc+curr+addNewLine(work_tree,i)), '');
     p.log.error('Changes not staged for commit:\n'+unstaged_files)
     const selected_for_staging = await p.multiselect({
       message: `Some files have not been staged, would you like to add them now? ${SPACE_TO_SELECT}`,
       options: [{value: '.', label: '.'}, ...work_tree.map(v => ({value: v, label: v}))],
       required: false,
     }) as string[]
    if (p.isCancel(selected_for_staging)) process.exit(0)
      git_add(selected_for_staging);
    }

    let updated_status = git_status() 
    if (!updated_status.index.length) {
      p.log.error(color.red('no changes added to commit (use "git add" and/or "git commit -a")'))
      process.exit(0);
    }
  } 

  if (config.commit_type.enable) {
    let message = 'Select a commit type';
    let initial_value = config.commit_type.initial_value 
    if (config.commit_type.infer_type_from_branch) {
      const options = config.commit_type.options.map(o => o.value)
      const type_from_branch = infer_type_from_branch(options)
      if (type_from_branch) {
        message = `Commit type inferred from branch ${color.dim('(confirm / edit)')}`
        initial_value = type_from_branch
      } 
    }
    const value_to_data: Record<string, {emoji: string, trailer: string}> = config.commit_type.options.reduce(
      (acc, curr) => ({ ...acc, [curr.value]: {emoji: curr.emoji ?? '', trailer: curr.trailer ?? '' }}), {}
    )
    const commit_type = await p.select(
        {
          message,
          initialValue: initial_value,
          options: config.commit_type.options,
        }
    )
    if (p.isCancel(commit_type)) process.exit(0)
    commit_state.trailer = value_to_data[commit_type].trailer;
    commit_state.type = config.commit_type.append_emoji_to_commit ?
      `${value_to_data[commit_type].emoji} ${commit_type}`.trim()
    : commit_type;
  }

  if (config.commit_scope.enable) {
   let commit_scope = await p.select({
      message: 'Select a commit scope',
      initialValue: config.commit_scope.initial_value,
      options: config.commit_scope.options
    })
    if (p.isCancel(commit_scope)) process.exit(0)
    if (commit_scope === CUSTOM_SCOPE_KEY && config.commit_scope.custom_scope) {
      commit_scope = await p.text({ 
        message: 'Write a custom scope',
        placeholder: ''
      })
      if (p.isCancel(commit_scope)) process.exit(0)
    }
    commit_state.scope = commit_scope;
  }

  if (config.check_ticket.infer_ticket) {
    try {
      const branch = execSync('git branch --show-current', {stdio : 'pipe' }).toString();
      const found: string[] = [
        branch.match(REGEX_START_UND),
        branch.match(REGEX_SLASH_UND),
        branch.match(REGEX_SLASH_TAG),
        branch.match(REGEX_SLASH_NUM),
        branch.match(REGEX_START_TAG),
        branch.match(REGEX_START_NUM),
      ]
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
      message: commit_state.ticket ?  `Ticket / issue inferred from branch ${color.dim('(confirm / edit)')}`: `Add ticket / issue ${OPTIONAL_PROMPT}`,
      placeholder: '',
      initialValue: commit_state.ticket,
    })
    if (p.isCancel(user_commit_ticket)) process.exit(0)
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
  )
  if (p.isCancel(commit_title)) process.exit(0)
  commit_state.title = clean_commit_title(commit_title);

  if (config.commit_body.enable) {
    const commit_body = await p.text({
            message: `Write a detailed description of the changes ${OPTIONAL_PROMPT}`,
            placeholder: '',
            validate: (val) => {
              if (config.commit_body.required && !val) return 'Please enter a description' 
            }
        
    })
    if (p.isCancel(commit_body)) process.exit(0)
    commit_state.body = commit_body ?? '';
  }

  if (config.commit_footer.enable) {
    const commit_footer = await p.multiselect({
            message: `Select optional footers ${SPACE_TO_SELECT}`,
            initialValues: config.commit_footer.initial_value,
            options: COMMIT_FOOTER_OPTIONS as {value: z.infer<typeof Z_FOOTER_OPTIONS>, label: string, hint: string}[],
            required: false
    }) 
    if (p.isCancel(commit_footer)) process.exit(0)

    if (commit_footer.includes('breaking-change')) {
      const breaking_changes_title = await p.text({
              message: 'Breaking changes: Write a short title / summary',
              placeholder: '',
              validate: (value) => {
                if (!value) return 'Please enter a title / summary'
              }
      })
      if (p.isCancel(breaking_changes_title)) process.exit(0)
      const breaking_changes_body = await p.text({
              message: `Breaking Changes: Write a description & migration instructions ${OPTIONAL_PROMPT}`,
              placeholder: '',
      })
      if (p.isCancel(breaking_changes_body)) process.exit(0)
      commit_state.breaking_title = breaking_changes_title;
      commit_state.breaking_body = breaking_changes_body;
    }

    if (commit_footer.includes('deprecated')) {
      const deprecated_title = await p.text({
              message: 'Deprecated: Write a short title / summary',
              placeholder: '',
              validate: (value) => {
                if (!value) return 'Please enter a title / summary'
              }
      })
      if (p.isCancel(deprecated_title)) process.exit(0)
      const deprecated_body = await p.text({
              message: `Deprecated: Write a description ${OPTIONAL_PROMPT}`,
              placeholder: '',
      })
      if (p.isCancel(deprecated_body)) process.exit(0)
      commit_state.deprecates_body = deprecated_body;
      commit_state.deprecates_title = deprecated_title;
    }

    if (commit_footer.includes('closes')) {
      commit_state.closes = 'Closes:'
    }

    if (commit_footer.includes('custom')) {
      const custom_footer = await p.text({
              message: 'Write a custom footer',
              placeholder: '',
      })
      if (p.isCancel(custom_footer)) process.exit(0)
      commit_state.custom_footer = custom_footer;
    }

    if (!commit_footer.includes('trailer')) {
      commit_state.trailer = '';
    }
  }
  

  let continue_commit = true;
  p.note(build_commit_string(commit_state, config, true, false, true), 'Commit Preview')
  if (config.confirm_commit) {
    continue_commit = await p.confirm({message: 'Confirm Commit?'}) as boolean;
    if (p.isCancel(continue_commit)) process.exit(0)
  }

  if (!continue_commit) {
    p.log.info('Exiting without commit')
    process.exit(0)
  } 

  try {      
    const options = config.overrides.shell ? { shell: config.overrides.shell } : {}
    const trailer = commit_state.trailer ? `--trailer="${commit_state.trailer}"` : '';
    const output = execSync(`git commit -m "${build_commit_string(commit_state, config, false, true, false)}" ${trailer}`, options).toString().trim();
    if (config.print_commit_output) p.log.info(output)
  } catch(err) {
    p.log.error('Something went wrong when committing: ' + err)
  }
}

function build_commit_string(commit_state: z.infer<typeof CommitState>,
  config: z.infer<typeof Config>,
  colorize: boolean = false,
  escape_quotes: boolean = false,
  include_trailer: boolean = false
): string {
  let commit_string = '';
  if (commit_state.type) {
    commit_string += colorize ? color.blue(commit_state.type) : commit_state.type
  } 

  if (commit_state.scope) {
    const scope = colorize ? color.cyan(commit_state.scope) : commit_state.scope;
    commit_string += `(${scope})`
  }

  let title_ticket = commit_state.ticket;
  const surround = config.check_ticket.surround;
  if (commit_state.ticket && surround) {
    const open_token = surround.charAt(0);
    const close_token = surround.charAt(1);
    title_ticket = `${open_token}${commit_state.ticket}${close_token}` 
  }

  const position_before_colon = config.check_ticket.title_position === "before-colon"
  if (title_ticket && config.check_ticket.add_to_title && position_before_colon) {
    const spacing = commit_state.scope || (commit_state.type && !config.check_ticket.surround) ? ' ' : '';
    commit_string += colorize ? color.magenta(spacing + title_ticket) : spacing + title_ticket
  }

  if (commit_state.breaking_title && config.breaking_change.add_exclamation_to_title) {
    commit_string += colorize ? color.red('!') : '!'
  }

  if (commit_state.scope || commit_state.type || (title_ticket && position_before_colon)) {
     commit_string += ': '
  }

  const position_start = config.check_ticket.title_position === "start"
  const position_end = config.check_ticket.title_position === "end"
  if(title_ticket && config.check_ticket.add_to_title && position_start) {
    commit_string += colorize ? color.magenta(title_ticket) + ' ' : title_ticket + ' '
  }

  if (commit_state.title) {
    commit_string += colorize ? color.reset(commit_state.title) : commit_state.title 
  }

  if(title_ticket && config.check_ticket.add_to_title && position_end) {
    commit_string +=  ' ' + (colorize ? color.magenta(title_ticket) : title_ticket)
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

  if (commit_state.custom_footer) {
    const temp = commit_state.custom_footer.split('\\n')
    const res = temp.map(v => colorize ? color.reset(v.trim()) : v.trim()).join('\n')
    commit_string += colorize ? `\n\n${res}` : `\n\n${res}`;
  }

  if (commit_state.closes && commit_state.ticket) {
    commit_string += colorize ? `\n\n${color.reset(commit_state.closes)} ${color.magenta(commit_state.ticket)}` : `\n\n${commit_state.closes} ${commit_state.ticket}`;
  }

  if (include_trailer && commit_state.trailer) {
    commit_string += colorize ? `\n\n${color.dim(commit_state.trailer)}` : `\n\n${commit_state.trailer}`
  }

  if (escape_quotes) {
    commit_string = commit_string.replaceAll('"', '\\"')
  }

  return commit_string;
}

