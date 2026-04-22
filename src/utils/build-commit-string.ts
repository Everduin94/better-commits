import color from "picocolors";
import { InferOutput } from "valibot";
import { CommitState, Config } from "../valibot-state";

type BuildCommitStringInput = {
  commit_state: InferOutput<typeof CommitState>;
  config: InferOutput<typeof Config>;
  colorize?: boolean;
  escape_quotes?: boolean;
  include_trailer?: boolean;
};

export function build_commit_string({
  commit_state,
  config,
  colorize = false,
  escape_quotes = false,
  include_trailer = false,
}: BuildCommitStringInput): string {
  let commit_string = "";
  if (commit_state.type) {
    commit_string += colorize
      ? color.blue(commit_state.type)
      : commit_state.type;
  }

  if (commit_state.scope) {
    const scope = colorize
      ? color.cyan(commit_state.scope)
      : commit_state.scope;
    commit_string += `(${scope})`;
  }

  let title_ticket = commit_state.ticket;
  const surround = config.check_ticket.surround;
  if (commit_state.ticket && surround) {
    const open_token = surround.charAt(0);
    const close_token = surround.charAt(1);
    title_ticket = `${open_token}${commit_state.ticket}${close_token}`;
  }

  const position_beginning = config.check_ticket.title_position === "beginning";
  if (title_ticket && config.check_ticket.add_to_title && position_beginning) {
    commit_string = `${colorize ? color.magenta(title_ticket) : title_ticket} ${commit_string}`;
  }

  const position_before_colon =
    config.check_ticket.title_position === "before-colon";
  if (
    title_ticket &&
    config.check_ticket.add_to_title &&
    position_before_colon
  ) {
    const spacing =
      commit_state.scope || (commit_state.type && !config.check_ticket.surround)
        ? " "
        : "";
    commit_string += colorize
      ? color.magenta(spacing + title_ticket)
      : spacing + title_ticket;
  }

  if (
    commit_state.breaking_title &&
    config.breaking_change.add_exclamation_to_title
  ) {
    commit_string += colorize ? color.red("!") : "!";
  }

  if (
    commit_state.scope ||
    commit_state.type ||
    (title_ticket && position_before_colon)
  ) {
    commit_string += ": ";
  }

  const position_start = config.check_ticket.title_position === "start";
  const position_end = config.check_ticket.title_position === "end";
  if (title_ticket && config.check_ticket.add_to_title && position_start) {
    commit_string += colorize
      ? color.magenta(title_ticket) + " "
      : title_ticket + " ";
  }

  if (commit_state.title) {
    commit_string += colorize
      ? color.reset(commit_state.title)
      : commit_state.title;
  }

  if (title_ticket && config.check_ticket.add_to_title && position_end) {
    commit_string +=
      " " + (colorize ? color.magenta(title_ticket) : title_ticket);
  }

  if (commit_state.body) {
    const temp = commit_state.body.split("\\n");
    const res = temp
      .map((value) => (colorize ? color.reset(value.trim()) : value.trim()))
      .join("\n");
    commit_string += `\n\n${res}`;
  }

  if (commit_state.breaking_title) {
    const title = colorize
      ? color.red(`BREAKING CHANGE: ${commit_state.breaking_title}`)
      : `BREAKING CHANGE: ${commit_state.breaking_title}`;
    commit_string += `\n\n${title}`;
  }

  if (commit_state.breaking_body) {
    const body = colorize
      ? color.red(commit_state.breaking_body)
      : commit_state.breaking_body;
    commit_string += `\n\n${body}`;
  }

  if (commit_state.deprecates_title) {
    const title = colorize
      ? color.yellow(`DEPRECATED: ${commit_state.deprecates_title}`)
      : `DEPRECATED: ${commit_state.deprecates_title}`;
    commit_string += `\n\n${title}`;
  }

  if (commit_state.deprecates_body) {
    const body = colorize
      ? color.yellow(commit_state.deprecates_body)
      : commit_state.deprecates_body;
    commit_string += `\n\n${body}`;
  }

  if (commit_state.custom_footer) {
    const temp = commit_state.custom_footer.split("\\n");
    const res = temp
      .map((value) => (colorize ? color.reset(value.trim()) : value.trim()))
      .join("\n");
    commit_string += `\n\n${res}`;
  }

  if (commit_state.closes && commit_state.ticket) {
    commit_string += colorize
      ? `\n\n${color.reset(commit_state.closes)} ${color.magenta(commit_state.ticket)}`
      : `\n\n${commit_state.closes} ${commit_state.ticket}`;
  }

  if (include_trailer && commit_state.trailer) {
    commit_string += colorize
      ? `\n\n${color.dim(commit_state.trailer)}`
      : `\n\n${commit_state.trailer}`;
  }

  if (escape_quotes) {
    commit_string = commit_string.replaceAll('"', '\\"').replaceAll("`", "\\`");
  }

  return commit_string;
}
