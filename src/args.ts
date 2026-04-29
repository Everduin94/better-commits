import { parse } from "@bomb.sh/args";
import { InferOutput } from "valibot";
import { CommitState } from "./valibot-state";

type CommitStateRuntime = InferOutput<typeof CommitState>;

type ParsedRuntimeFlags = {
  help: boolean;
  version: boolean;
  git_args: string;
  no_interactive: boolean;
  dry_run: boolean;
  commit_state: Partial<CommitStateRuntime>;
};

export const COMMIT_OPTIONS = [
  "type",
  "scope",
  "title",
  "body",
  "ticket",
  "closes",
  "trailer",
  "breaking-title",
  "breaking-body",
  "deprecates-title",
  "deprecates-body",
  "custom-footer",
] as const;

export const GIT_OPTIONS = ["git-dir", "work-tree"] as const;

export const BOOLEAN_FLAGS = [
  "interactive",
  "dry-run",
  "help",
  "version",
] as const;

class Flags {
  #runtime: ParsedRuntimeFlags;

  constructor(runtime: ParsedRuntimeFlags) {
    this.#runtime = runtime;
  }

  get git_args(): string {
    return this.#runtime.git_args;
  }

  get interactive(): boolean {
    return !this.#runtime.no_interactive;
  }

  get dry_run(): boolean {
    return this.#runtime.dry_run;
  }

  get help(): boolean {
    return this.#runtime.help;
  }

  get version(): boolean {
    return this.#runtime.version;
  }

  get commit_state(): Partial<CommitStateRuntime> {
    return this.#runtime.commit_state;
  }
}

export const flags = new Flags(parse_runtime_flags(process.argv.slice(2)));

export function parse_runtime_flags(argv: string[]): ParsedRuntimeFlags {
  const parsed = parse(argv, {
    alias: { h: "help", v: "version" },
    boolean: BOOLEAN_FLAGS,
    string: [...COMMIT_OPTIONS, ...GIT_OPTIONS],
  });

  const commit_state: Partial<CommitStateRuntime> = {};
  COMMIT_OPTIONS.forEach((value) => {
    const cli_value = parsed[value];
    const normalized_value = normalize_commit_flag(value, cli_value);
    if (normalized_value !== undefined) {
      const str = value.replace("-", "_") as keyof CommitStateRuntime;
      commit_state[str] = normalized_value;
    }
  });

  return {
    help: parsed["help"] === true,
    version: parsed["version"] === true,
    git_args: get_git_args(parsed["git-dir"], parsed["work-tree"]),
    no_interactive: parsed.interactive === false,
    dry_run: parsed["dry-run"] === true,
    commit_state,
  };
}

function normalize_commit_flag(
  option: (typeof COMMIT_OPTIONS)[number],
  value: string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  if (option !== "closes") return value;

  const normalized = value.trim().toLowerCase();
  if (normalized === "false") {
    return undefined;
  }

  if (value === "" || normalized) {
    return "Closes:";
  }

  return undefined;
}

function get_git_args(
  git_dir: string | undefined,
  work_tree: string | undefined,
): string {
  return `${git_dir ? `--git-dir=${git_dir}` : ""} ${work_tree ? `--work-tree=${work_tree}` : ""}`.trim();
}
