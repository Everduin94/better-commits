import * as p from "@clack/prompts";
import { execSync } from "child_process";
import fs from "fs";
import { homedir } from "os";
import color from "picocolors";
import { InferOutput, ValiError, parse } from "valibot";
import { Config } from "./valibot-state";
import { V_BRANCH_ACTIONS } from "./valibot-consts";
import { flags } from "./args";
import Configstore from "configstore";

export const CONFIG_FILE_NAME = ".better-commits.json";
export const SPACE_TO_SELECT = `${color.dim("(<space> to select)")}`;
export const A_FOR_ALL = `${color.dim(
  "(<space> to select, <a> to select all)",
)}`;
export const OPTIONAL_PROMPT = `${color.dim("(optional)")}`;
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
  value: InferOutput<typeof V_BRANCH_ACTIONS>;
  label: string;
  hint?: string;
}[] = [
  { value: "branch", label: "Branch" },
  { value: "worktree", label: "Worktree" },
];

export const NOOP_PROMPT_CACHE = {
  get: () => "",
  set: (key: string, value: string) => {},
  clear: () => {},
} as unknown as Configstore;

export type ConfigSource = "repository" | "global" | "none";

export type LoadedSetup = {
  config: InferOutput<typeof Config>;
  config_source: ConfigSource;
};

/* LOAD */
export function load_setup(
  cli_name = " better-commits ",
  git_args = flags.git_args,
): LoadedSetup {
  console.clear();
  p.intro(`${color.bgCyan(color.black(cli_name))}`);

  let global_config = null;
  const home_path = get_default_config_path();
  if (fs.existsSync(home_path)) {
    global_config = read_config_from_path(home_path);
  }

  const root = get_git_root(git_args);
  const root_path = `${root}/${CONFIG_FILE_NAME}`;
  if (fs.existsSync(root_path)) {
    p.log.step("Reading from Repository Config");
    const repo_config = read_config_from_path(root_path);
    return {
      config: global_config
        ? {
            ...repo_config,
            overrides: global_config.overrides.shell
              ? global_config.overrides
              : repo_config.overrides,
            confirm_with_editor: global_config.confirm_with_editor,
            cache_last_value: global_config.cache_last_value,
          }
        : repo_config,
      config_source: "repository",
    };
  }

  if (global_config) {
    p.log.step("Reading from Global Config");
    return {
      config: global_config,
      config_source: "global",
    };
  }

  const default_config = parse(Config, {});
  p.log.step(
    "Config not found. Generating default .better-commit.json at $HOME",
  );
  fs.writeFileSync(home_path, JSON.stringify(default_config, null, 4));
  return {
    config: default_config,
    config_source: "none",
  };
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

function validate_config(config: unknown): InferOutput<typeof Config> {
  try {
    return parse(Config, config);
  } catch (err: any) {
    if (err instanceof ValiError) {
      const first_issue_path = err.issues[0].path ?? [];
      const dot_path = first_issue_path
        .map((item: { key?: unknown }) => item.key)
        .filter(
          (key: unknown): key is string | number =>
            typeof key === "string" || typeof key === "number",
        )
        .join(".");
      p.log.error(
        `Invalid Configuration: ${color.red(dot_path)}\n` + err.message,
      );
    }
    process.exit(0);
  }
}
/* END LOAD */

/*
rev-parse will fail in a --bare repository root
*/
export function get_git_root(git_args = flags.git_args): string {
  let path = ".";
  try {
    path = execSync(`git ${git_args} rev-parse --show-toplevel`)
      .toString()
      .trim();
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

export function get_package_version(): string {
  try {
    const package_json = JSON.parse(
      fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as { version?: string };

    return package_json.version ?? "unknown";
  } catch {
    return "unknown";
  }
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

export function get_value_from_cache(
  config_store: Configstore,
  key: string,
): string {
  try {
    return config_store.get(key) ?? "";
  } catch (err) {
    p.log.warn(
      `Could not access ${key} from cache. Check that "~/.config" exists. Set "cache_last_value" to false to disable.`,
    );
  }

  return "";
}

export function set_value_cache(
  config_store: Configstore,
  key: string,
  value: string,
): void {
  try {
    config_store.set(key, value);
  } catch (err) {
    p.log.warn(
      `Could not access ${key} from cache. Check that "~/.config" exists. Set "cache_last_value" to false to disable.`,
    );
  }
}
