import * as p from "@clack/prompts";
import { execSync } from "child_process";
import fs from "fs";
import { homedir } from "os";
import color from "picocolors";
import { Output, ValiError, parse } from "valibot";
import { Config } from "./valibot-state";
import { V_BRANCH_ACTIONS } from "./valibot-consts";

export const CONFIG_FILE_NAME = ".better-commits.json";
export const SPACE_TO_SELECT = `${color.dim("(<space> to select)")}`;
export const A_FOR_ALL = `${color.dim(
  "(<space> to select, <a> to select all)",
)}`;
export const OPTIONAL_PROMPT = `${color.dim("(optional)")}`;
export const CACHE_PROMPT = `${color.dim("(value will be saved)")}`;
export const REGEX_SLASH_TAG = new RegExp(/\/(\w+-\d+)/);
export const REGEX_START_TAG = new RegExp(/^(\w+-\d+)/);
export const REGEX_START_UND = new RegExp(/^([A-Z]+-[\[a-zA-Z\]\d]+)_/);
export const REGEX_SLASH_UND = new RegExp(/\/([A-Z]+-[\[a-zA-Z\]\d]+)_/);

// TODO: This might conflict with version from better-branch
// - Maybe negative lookup against .
// - Maybe check the order
// - Maybe use order to split and check values
export const REGEX_SLASH_NUM = new RegExp(/\/(\d+)/);
export const REGEX_START_NUM = new RegExp(/^(\d+)/);

export const COMMIT_FOOTER_OPTIONS = [
  {
    value: "closes",
    label: "closes <issue/ticket>",
    hint: "Attempts to infer ticket from branch",
  },
  {
    value: "trailer",
    label: "trailer",
    hint: "Appends trailer based on commit type",
  },
  {
    value: "breaking-change",
    label: "breaking change",
    hint: "Add breaking change",
  },
  { value: "deprecated", label: "deprecated", hint: "Add deprecated change" },
  { value: "custom", label: "custom", hint: "Add a custom footer" },
];
export const BRANCH_ACTION_OPTIONS: {
  value: Output<typeof V_BRANCH_ACTIONS>;
  label: string;
  hint?: string;
}[] = [
  { value: "branch", label: "Branch" },
  { value: "worktree", label: "Worktree" },
];

/* LOAD */
export function load_setup(
  cli_name = " better-commits ",
): Output<typeof Config> {
  console.clear();
  p.intro(`${color.bgCyan(color.black(cli_name))}`);

  let global_config = null;
  const home_path = get_default_config_path();
  if (fs.existsSync(home_path)) {
    p.log.step("Found global config");
    global_config = read_config_from_path(home_path);
  }

  const root = get_git_root();
  const root_path = `${root}/${CONFIG_FILE_NAME}`;
  if (fs.existsSync(root_path)) {
    p.log.step("Found repository config");
    const repo_config = read_config_from_path(root_path);
    return global_config
      ? {
          ...repo_config,
          overrides: global_config.overrides.shell
            ? global_config.overrides
            : repo_config.overrides,
          confirm_with_editor: global_config.confirm_with_editor,
        }
      : repo_config;
  }

  if (global_config) return global_config;

  const default_config = parse(Config, {});
  p.log.step(
    "Config not found. Generating default .better-commit.json at $HOME",
  );
  fs.writeFileSync(home_path, JSON.stringify(default_config, null, 4));
  return default_config;
}

function read_config_from_path(config_path: string) {
  let res = null;
  try {
    res = JSON.parse(fs.readFileSync(config_path, "utf8"));
  } catch (err) {
    p.log.error("Invalid JSON file. Exiting.\n" + err);
    process.exit(0);
  }

  return validate_config(res);
}

function validate_config(config: Output<typeof Config>): Output<typeof Config> {
  try {
    return parse(Config, config);
  } catch (err: any) {
    if (err instanceof ValiError) {
      const first_issue_path = err.issues[0].path ?? [];
      const dot_path = first_issue_path.map((item) => item.key).join(".");
      p.log.error(
        `Invalid Configuration: ${color.red(dot_path)}\n` + err.message,
      );
    }
    process.exit(0);
  }
}
/* END LOAD */

export function infer_type_from_branch(types: string[]): string {
  let branch = "";
  try {
    branch = execSync("git branch --show-current", {
      stdio: "pipe",
    }).toString();
  } catch (err) {
    return "";
  }
  const found = types.find((t) => {
    const start_dash = new RegExp(`^${t}-`);
    const between_dash = new RegExp(`-${t}-`);
    const before_slash = new RegExp(`${t}\/`);
    const re = [
      branch.match(start_dash),
      branch.match(between_dash),
      branch.match(before_slash),
    ].filter((v) => v != null);
    return re?.length;
  });

  return found ?? "";
}

/*
rev-parse will fail in a --bare repository root
*/
export function get_git_root(): string {
  let path = ".";
  try {
    path = execSync("git rev-parse --show-toplevel").toString().trim();
  } catch (err) {
    p.log.warn(
      "Could not find git root. If in a --bare repository, ignore this warning.",
    );
  }
  return path;
}

export function get_default_config_path(): string {
  return homedir() + "/" + CONFIG_FILE_NAME;
}

export function addNewLine(arr: string[], i: number) {
  return i === arr.length - 1 ? "" : "\n";
}

export function clean_commit_title(title: string): string {
  const title_trimmed = title.trim();
  const remove_period = title_trimmed.endsWith(".");
  if (remove_period) {
    return title_trimmed.substring(0, title_trimmed.length - 1).trim();
  }
  return title.trim();
}

export function get_random_lyric_from_mood(mood: keyof typeof data): string {
  return data[mood][Math.floor(Math.random() * data[mood].length)];
}
