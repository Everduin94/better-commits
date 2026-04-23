import { parse } from "@bomb.sh/args";
import { InferOutput } from "valibot";
import { BranchState } from "./valibot-state";

type BranchStateRuntime = InferOutput<typeof BranchState>;

type ParsedRuntimeFlags = {
  help: boolean;
  version: boolean;
  git_args: string;
  no_interactive: boolean;
  dry_run: boolean;
  branch_state: Partial<BranchStateRuntime>;
};

const BRANCH_OPTIONS = [
  "user",
  "type",
  "description",
  "ticket",
  "branch-version",
  "checkout",
] as const;

export const GIT_OPTIONS = ["git-dir", "work-tree"] as const;

export const BOOLEAN_FLAGS = [
  "interactive",
  "dry-run",
  "help",
  "version",
] as const;

class BranchFlags {
  #runtime: ParsedRuntimeFlags;

  constructor(runtime: ParsedRuntimeFlags) {
    this.#runtime = runtime;
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

  get git_args(): string {
    return this.#runtime.git_args;
  }

  get branch_state(): Partial<BranchStateRuntime> {
    return this.#runtime.branch_state;
  }
}

export const branch_flags = new BranchFlags(
  parse_branch_runtime_flags(process.argv.slice(2)),
);

export function parse_branch_runtime_flags(argv: string[]): ParsedRuntimeFlags {
  const parsed = parse(argv, {
    alias: { h: "help", v: "version" },
    boolean: BOOLEAN_FLAGS,
    string: [...BRANCH_OPTIONS, ...GIT_OPTIONS],
  });

  const branch_state: Partial<BranchStateRuntime> = {};
  BRANCH_OPTIONS.forEach((value) => {
    const cli_value = parsed[value];
    if (cli_value) {
      const str = (value === "branch-version"
        ? "version"
        : value.replace("-", "_")) as keyof BranchStateRuntime;
      if (str === "checkout")
        branch_state[str] =
          (cli_value as "worktree" | "branch" | undefined) ?? "branch";
      else branch_state[str] = cli_value;
    }
  });

  return {
    help: parsed["help"] === true,
    version: parsed["version"] === true,
    git_args: get_git_args(parsed["git-dir"], parsed["work-tree"]),
    no_interactive: parsed["interactive"] === false,
    dry_run: parsed["dry-run"] === true,
    branch_state: branch_state,
  };
}

function get_git_args(
  git_dir: string | undefined,
  work_tree: string | undefined,
): string {
  return `${git_dir ? `--git-dir=${git_dir}` : ""} ${work_tree ? `--work-tree=${work_tree}` : ""}`.trim();
}
