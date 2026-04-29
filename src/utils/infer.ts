import { execSync } from "child_process";
import { flags } from "../args";
import { InferOutput } from "valibot";
import { Config } from "../valibot-state";
import { CUSTOM_SCOPE_KEY } from "../valibot-consts";

type PrependHashtag = "Never" | "Always" | "Prompt";

const REGEX_SLASH_TAG = /\/(\w+-\d+)/;
const REGEX_START_TAG = /^(\w+-\d+)/;
const REGEX_START_UND = /^([A-Z]+-[\[a-zA-Z\]\d]+)_/;
const REGEX_SLASH_UND = /\/([A-Z]+-[\[a-zA-Z\]\d]+)_/;
const REGEX_SLASH_NUM = /\/(\d+)/;
const REGEX_START_NUM = /^(\d+)/;

// TODO: Hypothetically, we could just do this, then remove code from prompts?
export function infer_not_interactive(config: InferOutput<typeof Config>) {
  if (flags.interactive) return;

  let inferred_state = { ticket: "", type: "", scope: "" };

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

  if (
    config.commit_scope.enable &&
    config.commit_scope.infer_scope_from_branch
  ) {
    const inferred_scope = infer_scope_from_git(
      config.commit_scope.options,
      flags.git_args,
    );
    inferred_state.scope = inferred_scope;
  }

  return inferred_state;
}

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

export function infer_scope_from_git(
  options: { value: string }[],
  git_args: string,
): string {
  const branch = get_current_branch(git_args);
  if (!branch) return "";

  return infer_scope_from_branch(branch, options);
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

  return options.append_hashtag || options.prepend_hashtag === "Always"
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

function escape_regexp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function infer_scope_from_branch(
  branch: string,
  options: { value: string }[],
): string {
  const scopes = options
    .map((option) => option.value)
    .filter((scope) => scope && scope !== CUSTOM_SCOPE_KEY)
    .sort((a, b) => b.length - a.length);

  const found = scopes.find((scope) => {
    const standalone_scope = new RegExp(
      `(?:^|[/_-])${escape_regexp(scope)}(?=$|[/_-])`,
    );

    return standalone_scope.test(branch);
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
