import * as p from "@clack/prompts";
import { execSync } from "child_process";
import color from "picocolors";
import { chdir } from "process";
import { branch_flags } from "../branch-args";
import { get_git_root } from "../utils";
import { build_branch, build_worktree_path } from "../utils/build-branch";
import { BranchRunnable } from "./branch-runnable";

export class BranchConfirmPrompt extends BranchRunnable {
  async run(): Promise<void> {
    this.#run_pre_commands();
    this.#run_checkout();
    this.#run_post_commands();
  }

  get #is_worktree(): boolean {
    return this.branch_state.checkout === "worktree";
  }

  get #pre_commands(): string[] {
    return this.#is_worktree
      ? this.config.worktree_pre_commands
      : this.config.branch_pre_commands;
  }

  get #post_commands(): string[] {
    return this.#is_worktree
      ? this.config.worktree_post_commands
      : this.config.branch_post_commands;
  }

  get #branch_name(): string {
    return build_branch(this.branch_state, this.config);
  }

  #run_pre_commands(): void {
    this.#run_commands(
      this.#pre_commands,
      "Something went wrong when executing pre-commands: ",
    );
  }

  #run_checkout(): void {
    const branch_name = this.#branch_name;
    const branch_flag = this.#verify_branch_name(branch_name);

    if (!this.#is_worktree) {
      try {
        execSync(
          `git ${branch_flags.git_args} checkout ${branch_flag} ${branch_name}`,
          {
            stdio: "inherit",
          },
        );
        p.log.info(
          `Switched to a new branch '${color.bgGreen(
            " " + color.black(branch_name) + " ",
          )}'`,
        );
      } catch (err) {
        process.exit(0);
      }

      return;
    }

    try {
      const worktree_name = build_worktree_path(
        this.branch_state,
        this.config,
        get_git_root(branch_flags.git_args),
      );
      execSync(
        `git ${branch_flags.git_args} worktree add ${worktree_name} ${branch_flag} ${branch_name}`,
        {
          stdio: "inherit",
        },
      );
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
    } catch (err) {
      process.exit(0);
    }
  }

  #run_post_commands(): void {
    this.#run_commands(
      this.#post_commands,
      "Something went wrong when executing post-commands: ",
    );
  }

  #run_commands(commands: string[], error_message: string): void {
    commands.forEach((command) => {
      try {
        execSync(command, { stdio: "inherit" });
      } catch (err) {
        p.log.error(error_message + err);
        process.exit(0);
      }
    });
  }

  #verify_branch_name(branch_name: string): string {
    // TODO: There has to be a better way 🤦
    let branch_flag = "";
    try {
      execSync(`git ${branch_flags.git_args} show-ref ${branch_name}`, {
        encoding: "utf-8",
      });
      p.log.warning(
        color.yellow(
          `${branch_name} already exists! Checking out existing branch.`,
        ),
      );
    } catch (err) {
      // Branch does not exist
      branch_flag = "-b";
    }

    return branch_flag;
  }
}
