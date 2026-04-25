import * as p from "@clack/prompts";
import { flags } from "../args";
import { get_value_from_cache, set_value_cache } from "../utils";
import { infer_type_from_git } from "../utils/infer";
import { cache_message, inferred_message } from "../utils/messages";
import { Runnable } from "./runnable";

export class CommitTypePrompt extends Runnable {
  async run() {
    if (this.#is_enabled) {
      const { initial_value, message } = this.#initial_value;
      const prompt_type = this.config.commit_type.autocomplete
        ? p.autocomplete
        : p.select;
      const commit_type = await prompt_type({
        message,
        initialValue: initial_value,
        maxItems: this.#max_items,
        options: this.#options,
      });
      if (p.isCancel(commit_type)) process.exit(0);

      this.#run_post_effects(commit_type);
    }
  }

  get #is_enabled(): boolean {
    return this.config.commit_type.enable;
  }

  get #initial_value(): { initial_value: string | undefined; message: string } {
    const cache_value = get_value_from_cache(this.prompt_cache, "commit_type");
    if (cache_value)
      return {
        initial_value: cache_value,
        message: cache_message("Commit type"),
      };

    if (this.config.commit_type.infer_type_from_branch) {
      const type_from_branch = infer_type_from_git(
        this.#options,
        flags.git_args,
      );
      if (type_from_branch) {
        return {
          message: inferred_message("Commit type"),
          initial_value: type_from_branch,
        };
      }
    }

    return {
      initial_value: this.config.commit_type.initial_value,
      message: "Select a commit type",
    };
  }

  get #options(): {
    label: string | undefined;
    value: string;
    emoji?: string;
    hint?: string;
    trailer?: string;
  }[] {
    return this.config.commit_type.options;
  }

  get #value_to_data(): Record<string, { emoji: string; trailer: string }> {
    return this.#options.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.value]: {
          emoji: curr.emoji ?? "",
          trailer: curr.trailer ?? "",
        },
      }),
      {},
    );
  }

  get #max_items(): number | undefined {
    return this.config.commit_type.max_items;
  }

  #run_post_effects(prompt_result: string): void {
    set_value_cache(this.prompt_cache, "commit_type", prompt_result);

    const value_to_data = this.#value_to_data;
    this.commit_state.trailer = value_to_data[prompt_result].trailer;
    this.commit_state.type =
      this.config.commit_type.append_emoji_to_commit &&
      this.config.commit_type.emoji_commit_position === "Start"
        ? `${value_to_data[prompt_result].emoji} ${prompt_result}`.trim()
        : prompt_result;
  }
}
