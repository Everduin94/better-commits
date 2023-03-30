import {homedir}  from 'os';
import { StatusResult } from 'simple-git';
import { z } from 'zod';
import color from 'picocolors';
import { execSync } from 'child_process';

export const CONFIG_FILE_NAME = '.better-commits.json'
export const SPACE_TO_SELECT = `${color.dim('(<space> to select)')}`
export const OPTIONAL_PROMPT =  `${color.dim('(optional)')}`
export const REGEX_SLASH_TAG = new RegExp(/\/(\w+-\d+)/)
export const REGEX_START_TAG = new RegExp(/^(\w+-\d+)/)
export const REGEX_SLASH_NUM = new RegExp(/\/(\d+)/)
export const REGEX_START_NUM = new RegExp(/^(\d+)/)
export const DEFAULT_TYPE_OPTIONS = [
    { value: 'feat', label: 'feat' , hint: 'A new feature'},
    { value: 'fix', label: 'fix' , hint: 'A bug fix'},
    { value: 'docs', label: 'docs', hint: 'Documentation only changes'},
    { value: 'refactor', label: 'refactor', hint: 'A code change that neither fixes a bug nor adds a feature'},
    { value: 'perf', label: 'perf', hint: 'A code change that improves performance'},
    { value: 'test', label: 'test', hint: 'Adding missing tests or correcting existing tests'},
    { value: 'build', label: 'build', hint: 'Changes that affect the build system or external dependencies'},
    { value: 'ci', label: 'ci', hint: 'Changes to our CI configuration files and scripts'},
    { value: 'chore', label: 'chore', hint: 'Other changes that do not modify src or test files'},
    { value: '', label: 'none'},
]
export const DEFAULT_SCOPE_OPTIONS = [
    { value: 'app', label: 'app' },
    { value: 'shared', label: 'shared' },
    { value: 'server', label: 'server' },
    { value: 'tools', label: 'tools' },
    { value: '', label: 'none'},
]
export const COMMIT_FOOTER_OPTIONS = [
  { value: 'closes', label: 'closes <issue/ticket>', hint: 'Attempts to infer ticket from branch'},
  { value: 'breaking-change', label: 'breaking change', hint: 'Add breaking change'},
  { value: 'deprecated', label: 'deprecated', hint: 'Add deprecated change'},
  { value: 'custom', label: 'custom', hint: 'Add a custom footer'},
]
export const CUSTOM_SCOPE_KEY: 'custom' = 'custom'

export const Z_FOOTER_OPTIONS = z.enum(['closes', 'breaking-change', 'deprecated', 'custom'])
export const FOOTER_OPTION_VALUES: z.infer<typeof Z_FOOTER_OPTIONS>[] = ['closes', 'breaking-change', 'deprecated', 'custom']

export function infer_type_from_branch(types: string[]): string {
  let branch = ''
  try {
    branch = execSync('git branch --show-current', {stdio : 'pipe' }).toString();
  } catch (err) {
    return ''
  }
  const found = types.find(t => {
    const start_dash = new RegExp(`^${t}-`)
    const between_dash = new RegExp(`-${t}-`)
    const before_slash = new RegExp(`${t}\/`)
    const re = [branch.match(start_dash), branch.match(between_dash), branch.match(before_slash)]
      .filter(v => v != null)
    return re?.length
  })

  return found ?? ''
}

export function get_git_root(): string {
  return execSync('git rev-parse --show-toplevel').toString().trim();
}

export function get_default_config_path(): string {
  return homedir()+'/'+CONFIG_FILE_NAME
}

export function check_missing_stage(stats: StatusResult): string[] {
  return stats.files.filter(f => f.index.trim() === '' || f.index === '?').map(f => f.path)
}

export function addNewLine(arr: string[], i: number) {
 return i === arr.length - 1 ? '' : '\n' 
}

export function clean_commit_title(title: string): string {
  const title_trimmed = title.trim();
  const remove_period = title_trimmed.endsWith('.')
  if (remove_period) {
    return title_trimmed.substring(0, title_trimmed.length - 1).trim();
  } 
  return title.trim()
}
