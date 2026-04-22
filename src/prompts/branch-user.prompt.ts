import * as p from "@clack/prompts";
import { get_value_from_cache, set_value_cache } from "../utils";
import { optional_message } from "../utils/messages";
import { BranchRunnable } from "./branch-runnable";

export class BranchUserPrompt extends BranchRunnable {
  async run(): Promise<void> {
    if (!this.#is_enabled) return;

    const user_name = await p.text({
      message: this.#message,
      placeholder: "",
      initialValue: this.#initial_value,
      validate: (value) => this.#validate(value),
    });

    if (p.isCancel(user_name)) process.exit(0);
    this.#run_post_effects(user_name ?? "");
  }

  get #is_enabled(): boolean {
    return this.config.branch_user.enable;
  }

  get #is_required(): boolean {
    return this.config.branch_user.required;
  }

  get #message(): string {
    return this.#is_required
      ? "Type your git username"
      : optional_message("Type your git username");
  }

  get #initial_value(): string {
    return (
      this.branch_state.user ||
      get_value_from_cache(this.prompt_cache, "username")
    );
  }

  #validate(value: string | undefined): string | undefined {
    if (this.#is_required && !value) return "Please enter a username";
  }

  #run_post_effects(prompt_result: string): void {
    this.branch_state.user = prompt_result.replace(/\s+/g, "-").toLowerCase();
    set_value_cache(this.prompt_cache, "username", this.branch_state.user);
  }
}
