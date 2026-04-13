import * as p from "@clack/prompts";
import { StdioOptions, execSync } from "child_process";
import { flags } from "../args";
import { Runnable } from "./runnable";
import { dry_run_message } from "../utils/messages";
import { build_commit_string } from "../utils/build-commit-string";

export class CommitConfirmPrompt extends Runnable {
  async run(): Promise<void> {
    if (this.#confirm_with_editor) {
      execSync(`${this.#commit_command} --edit`, this.#git_command_options);
      process.exit(0);
    }

    if (this.#print_commit_output) {
      p.note(
        build_commit_string({
          commit_state: this.commit_state,
          config: this.config,
          colorize: true,
          escape_quotes: false,
          include_trailer: true,
        }),
        "Commit Preview",
      );
    }

    const continue_commit = await this.#get_continue_commit();
    if (!continue_commit) {
      p.log.info("Exiting without commit");
      process.exit(0);
    }

    try {
      p.log.info(
        flags.dry_run
          ? dry_run_message("Committing changes...")
          : "Committing changes...",
      );
      execSync(
        this.#commit_command,
        flags.dry_run
          ? this.#git_command_options_quiet
          : this.#git_command_options,
      );
    } catch (err) {
      p.log.error("Something went wrong when committing: " + err);
      return;
    }

    this.#run_post_effects();
  }

  get #confirm_with_editor(): boolean {
    return flags.interactive && this.config.confirm_with_editor;
  }

  get #print_commit_output(): boolean {
    return this.config.print_commit_output;
  }

  get #confirm_commit(): boolean {
    return this.config.confirm_commit;
  }

  get #git_command_options(): { stdio: StdioOptions; shell?: string } {
    return this.config.overrides.shell
      ? { shell: this.config.overrides.shell, stdio: "inherit" as StdioOptions }
      : { stdio: "inherit" as StdioOptions };
  }

  get #git_command_options_quiet(): { stdio: StdioOptions; shell?: string } {
    return this.config.overrides.shell
      ? { shell: this.config.overrides.shell, stdio: "pipe" as StdioOptions }
      : { stdio: "pipe" as StdioOptions };
  }

  get #trailer_arg(): string {
    return this.commit_state.trailer
      ? `--trailer="${this.commit_state.trailer}"`
      : "";
  }

  get #commit_command(): string {
    return `git ${flags.git_args} commit -m "${build_commit_string({
      commit_state: this.commit_state,
      config: this.config,
      colorize: false,
      escape_quotes: true,
      include_trailer: false,
    })}" ${this.#trailer_arg} ${this.#dry_run_args}`.trim();
  }

  get #dry_run_args(): string {
    return flags.dry_run ? "--dry-run --porcelain --untracked-files=no" : "";
  }

  async #get_continue_commit(): Promise<boolean> {
    if (!flags.interactive) return true;
    if (!this.#confirm_commit) return true;

    // dry_run_message
    const continue_commit = (await p.confirm({
      message: flags.dry_run
        ? dry_run_message("Confirm Commit?")
        : "Confirm Commit?",
    })) as boolean;
    if (p.isCancel(continue_commit)) process.exit(0);
    return continue_commit;
  }

  #run_post_effects(): void {
    p.log.success("Commit Complete");

    const user_name = this.prompt_cache.get("username");
    this.prompt_cache.clear();
    if (user_name) this.prompt_cache.set("username", user_name);
  }
}
