import * as p from "@clack/prompts";
import {
  clean_commit_title,
  get_value_from_cache,
  set_value_cache,
} from "../utils";
import { cache_message } from "../utils/messages";
import { get_commit_title_size } from "../utils/commit-title-size";
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

    // this.commit_state.title will pull from flag if populated
    return {
      initial_value: this.commit_state.title,
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
    return get_commit_title_size(
      {
        type: this.commit_state.type,
        scope: this.commit_state.scope,
        ticket: this.commit_state.ticket,
        title: value,
      },
      {
        include_ticket: this.config.check_ticket.add_to_title,
      },
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
