import * as p from "@clack/prompts";
import color from "picocolors";
import { StdioOptions, execSync } from "child_process";
import { flags } from "../args";
import { Runnable } from "./runnable";

export class CommitConfirmPrompt extends Runnable {
  async run(): Promise<void> {
    if (this.#confirm_with_editor) {
      execSync(`${this.#commit_command} --edit`, this.#git_command_options);
      process.exit(0);
    }

    if (this.#print_commit_output) {
      p.note(
        this.#build_commit_string({
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
      p.log.info("Committing changes...");
      execSync(this.#commit_command, this.#git_command_options);
    } catch (err) {
      p.log.error("Something went wrong when committing: " + err);
      return;
    }

    this.#run_post_effects();
  }

  get #confirm_with_editor(): boolean {
    return this.config.confirm_with_editor;
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

  get #trailer_arg(): string {
    return this.commit_state.trailer
      ? `--trailer="${this.commit_state.trailer}"`
      : "";
  }

  get #commit_command(): string {
    return `git ${flags.git_args} commit -m "${this.#build_commit_string({
      colorize: false,
      escape_quotes: true,
      include_trailer: false,
    })}" ${this.#trailer_arg}`.trim();
  }

  async #get_continue_commit(): Promise<boolean> {
    if (!this.#confirm_commit) return true;

    const continue_commit = (await p.confirm({
      message: "Confirm Commit?",
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

  #build_commit_string({
    colorize = false,
    escape_quotes = false,
    include_trailer = false,
  }: {
    colorize?: boolean;
    escape_quotes?: boolean;
    include_trailer?: boolean;
  }): string {
    let commit_string = "";
    if (this.commit_state.type) {
      commit_string += colorize
        ? color.blue(this.commit_state.type)
        : this.commit_state.type;
    }

    if (this.commit_state.scope) {
      const scope = colorize
        ? color.cyan(this.commit_state.scope)
        : this.commit_state.scope;
      commit_string += `(${scope})`;
    }

    let title_ticket = this.commit_state.ticket;
    const surround = this.config.check_ticket.surround;
    if (this.commit_state.ticket && surround) {
      const open_token = surround.charAt(0);
      const close_token = surround.charAt(1);
      title_ticket = `${open_token}${this.commit_state.ticket}${close_token}`;
    }

    const position_beginning =
      this.config.check_ticket.title_position === "beginning";
    if (
      title_ticket &&
      this.config.check_ticket.add_to_title &&
      position_beginning
    ) {
      commit_string = `${colorize ? color.magenta(title_ticket) : title_ticket} ${commit_string}`;
    }

    const position_before_colon =
      this.config.check_ticket.title_position === "before-colon";
    if (
      title_ticket &&
      this.config.check_ticket.add_to_title &&
      position_before_colon
    ) {
      const spacing =
        this.commit_state.scope ||
        (this.commit_state.type && !this.config.check_ticket.surround)
          ? " "
          : "";
      commit_string += colorize
        ? color.magenta(spacing + title_ticket)
        : spacing + title_ticket;
    }

    if (
      this.commit_state.breaking_title &&
      this.config.breaking_change.add_exclamation_to_title
    ) {
      commit_string += colorize ? color.red("!") : "!";
    }

    if (
      this.commit_state.scope ||
      this.commit_state.type ||
      (title_ticket && position_before_colon)
    ) {
      commit_string += ": ";
    }

    const position_start = this.config.check_ticket.title_position === "start";
    const position_end = this.config.check_ticket.title_position === "end";
    if (
      title_ticket &&
      this.config.check_ticket.add_to_title &&
      position_start
    ) {
      commit_string += colorize
        ? color.magenta(title_ticket) + " "
        : title_ticket + " ";
    }

    if (this.commit_state.title) {
      commit_string += colorize
        ? color.reset(this.commit_state.title)
        : this.commit_state.title;
    }

    if (title_ticket && this.config.check_ticket.add_to_title && position_end) {
      commit_string +=
        " " + (colorize ? color.magenta(title_ticket) : title_ticket);
    }

    if (this.commit_state.body) {
      const temp = this.commit_state.body.split("\\n");
      const res = temp
        .map((value) => (colorize ? color.reset(value.trim()) : value.trim()))
        .join("\n");
      commit_string += `\n\n${res}`;
    }

    if (this.commit_state.breaking_title) {
      const title = colorize
        ? color.red(`BREAKING CHANGE: ${this.commit_state.breaking_title}`)
        : `BREAKING CHANGE: ${this.commit_state.breaking_title}`;
      commit_string += `\n\n${title}`;
    }

    if (this.commit_state.breaking_body) {
      const body = colorize
        ? color.red(this.commit_state.breaking_body)
        : this.commit_state.breaking_body;
      commit_string += `\n\n${body}`;
    }

    if (this.commit_state.deprecates_title) {
      const title = colorize
        ? color.yellow(`DEPRECATED: ${this.commit_state.deprecates_title}`)
        : `DEPRECATED: ${this.commit_state.deprecates_title}`;
      commit_string += `\n\n${title}`;
    }

    if (this.commit_state.deprecates_body) {
      const body = colorize
        ? color.yellow(this.commit_state.deprecates_body)
        : this.commit_state.deprecates_body;
      commit_string += `\n\n${body}`;
    }

    if (this.commit_state.custom_footer) {
      const temp = this.commit_state.custom_footer.split("\\n");
      const res = temp
        .map((value) => (colorize ? color.reset(value.trim()) : value.trim()))
        .join("\n");
      commit_string += `\n\n${res}`;
    }

    if (this.commit_state.closes && this.commit_state.ticket) {
      commit_string += colorize
        ? `\n\n${color.reset(this.commit_state.closes)} ${color.magenta(this.commit_state.ticket)}`
        : `\n\n${this.commit_state.closes} ${this.commit_state.ticket}`;
    }

    if (include_trailer && this.commit_state.trailer) {
      commit_string += colorize
        ? `\n\n${color.dim(this.commit_state.trailer)}`
        : `\n\n${this.commit_state.trailer}`;
    }

    if (escape_quotes) {
      commit_string = commit_string
        .replaceAll('"', '\\"')
        .replaceAll("`", "\\`");
    }

    return commit_string;
  }
}
