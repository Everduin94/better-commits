import * as p from "@clack/prompts";
import { execFileSync } from "child_process";
import color from "picocolors";
import { chdir } from "process";
import { branch_flags } from "../branch-args";
import { BranchHooks } from "../branch-hooks";
import { get_git_root } from "../utils";
import { build_branch, build_worktree_path } from "../utils/build-branch";
import { validate_branch_name } from "../utils/validate-branch-name";
import { BranchRunnable } from "./branch-runnable";

export class BranchConfirmPrompt extends BranchRunnable {
  async run(): Promise<void> {
    const branch_name = this.#branch_name;
    const validation_error = validate_branch_name(branch_name);
    if (validation_error) {
      p.log.error(validation_error);
      process.exit(1);
    }

    const hooks = new BranchHooks(this.config, this.branch_state);

    hooks.run_pre();
    this.#run_checkout(branch_name);
    hooks.run_post();
  }

  get #is_worktree(): boolean {
    return this.branch_state.checkout === "worktree";
  }

  get #branch_name(): string {
    return build_branch(this.branch_state, this.config);
  }

  #run_checkout(branch_name: string): void {
    const branch_flag = this.#verify_branch_name(branch_name);

    if (!this.#is_worktree) {
      const args = [
        "checkout",
        ...(branch_flag ? [branch_flag] : []),
        branch_name,
      ];
      if (branch_flags.dry_run) {
        this.#log_dry_run_command(args);
        return;
      }

      try {
        execFileSync("git", [...branch_flags.git_options, ...args], {
          stdio: "inherit",
        });
        p.log.info(
          `Switched to a new branch '${color.bgGreen(
            " " + color.black(branch_name) + " ",
          )}'`,
        );
      } catch {
        p.log.error(`Failed to checkout branch '${branch_name}'`);
        process.exit(1);
      }

      return;
    }

    const worktree_name = build_worktree_path(
      this.branch_state,
      this.config,
      get_git_root(branch_flags.git_options),
    );
    const args = branch_flag
      ? ["worktree", "add", branch_flag, branch_name, worktree_name]
      : ["worktree", "add", worktree_name, branch_name];
    if (branch_flags.dry_run) {
      this.#log_dry_run_command(args);
      return;
    }

    try {
      execFileSync("git", [...branch_flags.git_options, ...args], {
        stdio: "inherit",
      });
      p.log.info(
        `Created a new worktree ${color.bgGreen(
          " " + color.black(worktree_name) + " ",
        )}, checked out branch ${color.bgGreen(
          " " + color.black(branch_name) + " ",
        )}`,
      );
      p.log.info(
        color.bgMagenta(color.black(` cd ${worktree_name} `)) +
          " to navigate to your new worktree",
      );
      chdir(worktree_name);
    } catch {
      p.log.error(`Failed to create worktree '${worktree_name}'`);
      process.exit(1);
    }
  }

  #log_dry_run_command(args: string[]): void {
    const command = ["git", ...branch_flags.git_options, ...args].join(" ");
    p.log.info(`Dry run: ${command}`);
  }

  #verify_branch_name(branch_name: string): string {
    try {
      execFileSync(
        "git",
        [
          ...branch_flags.git_options,
          "show-ref",
          "--verify",
          "--quiet",
          `refs/heads/${branch_name}`,
        ],
        { encoding: "utf-8" },
      );
      p.log.warning(
        color.yellow(
          `${branch_name} already exists! Checking out existing branch.`,
        ),
      );
      return "";
    } catch {
      return "-b";
    }
  }
}
