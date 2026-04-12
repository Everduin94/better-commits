import * as p from "@clack/prompts";
import { CUSTOM_SCOPE_KEY } from "../valibot-consts";
import { get_value_from_cache, set_value_cache } from "../utils";
import { cache_message } from "../utils/messages";
import { Runnable } from "./runnable";

export class CommitScopePrompt extends Runnable {
  async run(): Promise<void> {
    if (!this.#is_enabled) return;
    const { initial_value, message } = this.#get_initial_value();

    let commit_scope = await p.select({
      message,
      initialValue: initial_value,
      maxItems: this.#max_items,
      options: this.#options,
    });
    if (p.isCancel(commit_scope)) process.exit(0);

    await this.#post_run_effects(commit_scope);
  }

  get #is_enabled(): boolean {
    return this.config.commit_scope.enable;
  }

  #get_initial_value(): { initial_value: string; message: string } {
    const cache_value = get_value_from_cache(this.prompt_cache, "commit_scope");
    if (cache_value) {
      return {
        initial_value: cache_value,
        message: cache_message("Commit scope"),
      };
    }

    return {
      initial_value: this.config.commit_scope.initial_value,
      message: "Select a commit scope",
    };
  }

  get #max_items(): number | undefined {
    return this.config.commit_scope.max_items;
  }

  get #options(): {
    label?: string | undefined;
    value: string;
    hint?: string;
  }[] {
    return this.config.commit_scope.options;
  }

  get #custom_scope_enabled(): boolean {
    return this.config.commit_scope.custom_scope;
  }

  async #post_run_effects(prompt_result: string): Promise<void> {
    set_value_cache(this.prompt_cache, "commit_scope", prompt_result);

    let commit_scope_value = prompt_result;
    if (commit_scope_value === CUSTOM_SCOPE_KEY && this.#custom_scope_enabled) {
      const commit_scope = await p.text({
        message: "Write a custom scope",
        placeholder: "",
      });
      if (p.isCancel(commit_scope)) process.exit(0);
      commit_scope_value = commit_scope ?? "";
    }

    this.commit_state.scope = commit_scope_value;
  }
}
