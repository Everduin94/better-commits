import * as p from "@clack/prompts";
import { get_value_from_cache, set_value_cache } from "../utils";
import { cache_message, optional_message } from "../utils/messages";
import { Runnable } from "./runnable";

export class CommitBodyPrompt extends Runnable {
  async run(): Promise<void> {
    if (!this.#is_enabled) return;

    const { initial_value, message } = this.#get_initial_value();
    const commit_body = await p.text({
      message,
      initialValue: initial_value,
      placeholder: "",
      validate: (value) => this.#validate(value),
    });

    if (p.isCancel(commit_body)) process.exit(0);
    this.#run_post_effects(commit_body ?? "");
  }

  get #is_enabled(): boolean {
    return this.config.commit_body.enable;
  }

  #get_initial_value(): { initial_value: string; message: string } {
    const cache_value = get_value_from_cache(this.prompt_cache, "commit_body");
    if (cache_value) {
      return {
        initial_value: cache_value,
        message: cache_message("Commit body"),
      };
    }

    return {
      initial_value: "",
      message: optional_message("Write a detailed description of the changes"),
    };
  }

  #validate(value: string | undefined): string | undefined {
    if (this.config.commit_body.required && !value) {
      return "Please enter a description";
    }
  }

  #split_by_period(value: string): string {
    if (!this.config.commit_body.split_by_period) return value;
    const sentences = value.split(/\.\s+/).map((sentence) => sentence.trim());
    return sentences.join(".\n");
  }

  #run_post_effects(prompt_result: string): void {
    set_value_cache(this.prompt_cache, "commit_body", prompt_result);
    this.commit_state.body = this.#split_by_period(prompt_result);
  }
}
