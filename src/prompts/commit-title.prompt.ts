import * as p from "@clack/prompts";
import {
  clean_commit_title,
  get_value_from_cache,
  set_value_cache,
} from "../utils";
import { cache_message } from "../utils/messages";
import { Runnable } from "./runnable";

export class CommitTitlePrompt extends Runnable {
  async run(): Promise<void> {
    const { initial_value, message } = this.#get_initial_value();
    const commit_title = await p.text({
      message,
      initialValue: initial_value,
      placeholder: "",
      validate: (value) => this.#validate(value),
    });

    if (p.isCancel(commit_title)) process.exit(0);
    this.#run_post_effects(commit_title ?? "");
  }

  #get_initial_value(): { initial_value: string; message: string } {
    const cache_value = get_value_from_cache(this.prompt_cache, "commit_title");
    if (cache_value) {
      return {
        initial_value: cache_value,
        message: cache_message("Commit title"),
      };
    }

    return {
      initial_value: "",
      message: "Write a brief title describing the commit",
    };
  }

  #validate(value: string | undefined): string | undefined {
    if (!value) return "Please enter a title";

    if (this.#get_size(value) > this.#max_size) {
      return `Exceeded max length. Title max [${this.#max_size}]`;
    }
  }

  get #max_size(): number {
    return this.config.commit_title.max_size;
  }

  #get_size(value: string): number {
    const commit_scope_size = this.commit_state.scope
      ? this.commit_state.scope.length + 2
      : 0;
    const commit_type_size = this.commit_state.type.length;
    const commit_ticket_size = this.config.check_ticket.add_to_title
      ? this.commit_state.ticket.length
      : 0;

    return (
      commit_scope_size + commit_type_size + commit_ticket_size + value.length
    );
  }

  // TODO: Extract to a Runnable abstract function?
  get #value_to_data(): Record<string, { emoji: string }> {
    return this.config.commit_type.options.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.value]: {
          emoji: curr.emoji ?? "",
        },
      }),
      {},
    );
  }

  #title_with_emoji(title: string): string {
    if (
      this.config.commit_type.append_emoji_to_commit &&
      this.config.commit_type.emoji_commit_position === "After-Colon"
    ) {
      const emoji = this.#value_to_data[this.commit_state.type]?.emoji ?? "";
      return `${emoji} ${title}`.trim();
    }

    return title;
  }

  #run_post_effects(prompt_result: string): void {
    set_value_cache(this.prompt_cache, "commit_title", prompt_result);
    this.commit_state.title = clean_commit_title(
      this.#title_with_emoji(prompt_result),
    );
  }
}
