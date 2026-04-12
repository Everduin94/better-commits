import * as p from "@clack/prompts";
import { execSync } from "child_process";
import { flags } from "../args";
import {
  REGEX_SLASH_NUM,
  REGEX_SLASH_TAG,
  REGEX_SLASH_UND,
  REGEX_START_NUM,
  REGEX_START_TAG,
  REGEX_START_UND,
  get_value_from_cache,
  set_value_cache,
} from "../utils";
import {
  cache_message,
  inferred_message,
  optional_message,
} from "../utils/messages";
import { Runnable } from "./runnable";

export class CommitTicketPrompt extends Runnable {
  async run(): Promise<void> {
    const { initial_value, message } = this.#get_initial_value();
    this.commit_state.ticket = initial_value;

    if (this.#confirm_ticket_enabled) {
      const user_commit_ticket = await p.text({
        message,
        placeholder: "",
        initialValue: initial_value,
      });
      if (p.isCancel(user_commit_ticket)) process.exit(0);
      set_value_cache(this.prompt_cache, "commit_ticket", user_commit_ticket);
      this.commit_state.ticket = user_commit_ticket ?? "";
    }

    if (
      this.#prepend_hashtag_always &&
      this.commit_state.ticket &&
      !this.commit_state.ticket.startsWith("#")
    ) {
      this.commit_state.ticket = "#" + this.commit_state.ticket;
    }
  }

  get #infer_ticket_enabled(): boolean {
    return this.config.check_ticket.infer_ticket;
  }

  get #confirm_ticket_enabled(): boolean {
    return this.config.check_ticket.confirm_ticket;
  }

  get #prepend_hashtag_always(): boolean {
    return this.config.check_ticket.prepend_hashtag === "Always";
  }

  #get_initial_value(): { initial_value: string; message: string } {
    const cache_value = get_value_from_cache(
      this.prompt_cache,
      "commit_ticket",
    );
    if (cache_value) {
      return {
        initial_value: cache_value,
        message: cache_message("Ticket / issue"),
      };
    }

    if (this.#infer_ticket_enabled) {
      const inferred_value = this.#infer_ticket_from_branch();
      if (inferred_value) {
        return {
          initial_value: inferred_value,
          message: inferred_message("Ticket / issue"),
        };
      }
    }

    return {
      initial_value: this.commit_state.ticket,
      message: optional_message("Add ticket / issue"),
    };
  }

  #infer_ticket_from_branch(): string {
    try {
      const branch = execSync(`git ${flags.git_args} branch --show-current`, {
        stdio: "pipe",
      }).toString();

      const found: string[] = [
        branch.match(REGEX_START_UND),
        branch.match(REGEX_SLASH_UND),
        branch.match(REGEX_SLASH_TAG),
        branch.match(REGEX_SLASH_NUM),
        branch.match(REGEX_START_TAG),
        branch.match(REGEX_START_NUM),
      ]
        .filter((v) => v != null)
        .map((v) => (v && v.length >= 2 ? v[1] : ""));

      if (found.length && found[0]) {
        return this.config.check_ticket.append_hashtag ||
          this.config.check_ticket.prepend_hashtag === "Prompt"
          ? "#" + found[0]
          : found[0];
      }
    } catch {
      // Can't find branch, fail silently
    }

    return "";
  }
}
