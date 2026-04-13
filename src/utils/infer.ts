import { execSync } from "child_process";

type PrependHashtag = "Never" | "Always" | "Prompt";

const REGEX_SLASH_TAG = /\/(\w+-\d+)/;
const REGEX_START_TAG = /^(\w+-\d+)/;
const REGEX_START_UND = /^([A-Z]+-[\[a-zA-Z\]\d]+)_/;
const REGEX_SLASH_UND = /\/([A-Z]+-[\[a-zA-Z\]\d]+)_/;
const REGEX_SLASH_NUM = /\/(\d+)/;
const REGEX_START_NUM = /^(\d+)/;

export function infer_type_from_git(
  options: { value: string }[],
  git_args: string,
): string {
  const branch = get_current_branch(git_args);
  if (!branch) return "";

  return infer_type_from_branch(
    branch,
    options.map((option) => option.value),
  );
}

export function infer_ticket_from_git(
  options: { append_hashtag: boolean; prepend_hashtag: PrependHashtag },
  git_args: string,
): string {
  const branch = get_current_branch(git_args);
  if (!branch) return "";

  return infer_ticket_from_branch(branch, options);
}

function infer_ticket_from_branch(
  branch: string,
  options: { append_hashtag: boolean; prepend_hashtag: PrependHashtag },
): string {
  const found: string[] = [
    branch.match(REGEX_START_UND),
    branch.match(REGEX_SLASH_UND),
    branch.match(REGEX_SLASH_TAG),
    branch.match(REGEX_SLASH_NUM),
    branch.match(REGEX_START_TAG),
    branch.match(REGEX_START_NUM),
  ]
    .filter((value) => value != null)
    .map((value) => (value && value.length >= 2 ? value[1] : ""));

  if (!found.length || !found[0]) return "";

  return options.append_hashtag || options.prepend_hashtag === "Prompt"
    ? `#${found[0]}`
    : found[0];
}

function infer_type_from_branch(branch: string, types: string[]): string {
  const found = types.find((type) => {
    const start_dash = new RegExp(`^${type}-`);
    const between_dash = new RegExp(`-${type}-`);
    const before_slash = new RegExp(`${type}/`);

    const matches = [
      branch.match(start_dash),
      branch.match(between_dash),
      branch.match(before_slash),
    ].filter((value) => value != null);

    return matches.length > 0;
  });

  return found ?? "";
}

function get_current_branch(git_args: string): string {
  try {
    return execSync(`git ${git_args} branch --show-current`, {
      stdio: "pipe",
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}
