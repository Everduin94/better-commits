import { parse } from "@bomb.sh/args";
import { InferOutput } from "valibot";
import { BranchState } from "./valibot-state";

type BranchStateRuntime = InferOutput<typeof BranchState>;

type ParsedRuntimeFlags = {
  help: boolean;
  no_interactive: boolean;
  dry_run: boolean;
  branch_state: Partial<BranchStateRuntime>;
};

const BRANCH_OPTIONS = [
  "user",
  "type",
  "description",
  "ticket",
  "version",
  "checkout",
] as const;

export const BOOLEAN_FLAGS = ["interactive", "dry-run", "help"] as const;

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

  get branch_state(): Partial<BranchStateRuntime> {
    return this.#runtime.branch_state;
  }
}

export const branch_flags = new BranchFlags(
  parse_branch_runtime_flags(process.argv.slice(2)),
);

export function parse_branch_runtime_flags(argv: string[]): ParsedRuntimeFlags {
  const parsed = parse(argv, {
    boolean: BOOLEAN_FLAGS,
    string: BRANCH_OPTIONS,
  });

  const branch_state: Partial<BranchStateRuntime> = {};
  BRANCH_OPTIONS.forEach((value) => {
    const cli_value = parsed[value];
    if (cli_value) {
      const str = value.replace("-", "_") as keyof BranchStateRuntime;
      if (str === "checkout_type")
        branch_state[str] =
          (cli_value as "worktree" | "branch" | undefined) ?? "branch";
      else branch_state[str] = cli_value;
    }
  });

  return {
    help: parsed["help"] === true,
    no_interactive: parsed.interactive === false,
    dry_run: parsed["dry-run"] === true,
    branch_state: branch_state,
  };
}
