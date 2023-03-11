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
    { value: 'feat', label: 'feat' },
    { value: 'fix', label: 'fix' },
    { value: 'docs', label: 'docs'},
    { value: 'refactor', label: 'refactor'},
    { value: 'perf', label: 'perf'},
    { value: 'test', label: 'test'},
    { value: '', label: 'none'},
]
export const DEFAULT_SCOPE_OPTIONS = [
    { value: 'app', label: 'app' },
    { value: 'shared', label: 'shared' },
    { value: 'server', label: 'server' },
    { value: 'tools', label: 'tools' },
    { value: '', label: 'none'},
]
export type FOOTER_OPTIONS = 'closes' | 'breaking-change' | 'deprecated'
export const COMMIT_FOOTER_OPTIONS = [
  { value: 'closes', label: 'closes <issue/ticket>', hint: 'Attempts to infer ticket from branch'},
  { value: 'breaking-change', label: 'breaking change', hint: 'Add breaking change'},
  { value: 'deprecated', label: 'deprecated', hint: 'Add deprecated change'},
]

// TODO: This could be better
export const Z_FOOTER_OPTIONS = z.enum(['closes', 'breaking-change', 'deprecated'])
export const FOOTER_OPTION_VALUES: FOOTER_OPTIONS[] = ['closes', 'breaking-change', 'deprecated']

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
