import * as p from "@clack/prompts";
import { flags } from "../args";
import { get_value_from_cache, set_value_cache } from "../utils";
import { infer_ticket_from_git } from "../utils/infer";
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
      const inferred_value = infer_ticket_from_git(
        {
          append_hashtag: this.config.check_ticket.append_hashtag,
          prepend_hashtag: this.config.check_ticket.prepend_hashtag,
        },
        flags.git_args,
      );
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
}
