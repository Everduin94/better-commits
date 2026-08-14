import * as p from "@clack/prompts";
import { execSync } from "child_process";
import { InferOutput } from "valibot";
import { branch_flags } from "./branch-args";
import { BranchState, Config } from "./valibot-state";
import { render_hook_command } from "./utils/render-hook-command";

export class BranchHooks {
  #pre_commands: string[];
  #post_commands: string[];
  #shell?: string;

  constructor(
    config: InferOutput<typeof Config>,
    branch_state: InferOutput<typeof BranchState>,
  ) {
    const is_worktree = branch_state.checkout === "worktree";
    const pre_commands = is_worktree
      ? config.worktree_pre_commands
      : config.branch_pre_commands;
    const post_commands = is_worktree
      ? config.worktree_post_commands
      : config.branch_post_commands;

    this.#shell = config.overrides.shell;
    this.#pre_commands = this.#render_commands(pre_commands, branch_state);
    this.#post_commands = this.#render_commands(post_commands, branch_state);
  }

  run_pre(): void {
    this.#run_commands(
      this.#pre_commands,
      "Something went wrong when executing pre-commands: ",
    );
  }

  run_post(): void {
    this.#run_commands(
      this.#post_commands,
      "Something went wrong when executing post-commands: ",
    );
  }

  #render_commands(
    commands: string[],
    branch_state: InferOutput<typeof BranchState>,
  ): string[] {
    return commands.map((command) =>
      render_hook_command(command, branch_state),
    );
  }

  #run_commands(commands: string[], error_message: string): void {
    commands.forEach((command) => {
      if (branch_flags.dry_run) {
        p.log.info(`Dry run: ${command}`);
        return;
      }

      try {
        execSync(command, { stdio: "inherit", shell: this.#shell });
      } catch (err) {
        p.log.error(`${error_message}${command}\n${err}`);
        throw err;
      }
    });
  }
}
