import * as p from "@clack/prompts";
import { BranchRunnable } from "./branch-runnable";

export class BranchTypePrompt extends BranchRunnable {
  async run(): Promise<void> {
    if (!this.#is_enabled) return;

    const prompt_type = this.config.branch_type.autocomplete
      ? p.autocomplete
      : p.select;
    const branch_type = await prompt_type({
      message: this.#message,
      initialValue: this.#initial_value,
      options: this.#options,
    });

    if (p.isCancel(branch_type)) process.exit(0);
    this.#run_post_effects(branch_type);
  }

  get #is_enabled(): boolean {
    return this.config.branch_type.enable;
  }

  get #message(): string {
    return "Select a branch type";
  }

  get #initial_value(): string {
    if (this.branch_state.type) return this.branch_state.type;

    const initial = this.config.commit_type.initial_value;
    const option = this.config.commit_type.options.find(
      (entry) => entry.value === initial || entry.branch_label === initial,
    );

    return option ? (option.branch_label ?? option.value) : initial;
  }

  get #options(): {
    label?: string | undefined;
    value: string;
    emoji?: string;
    hint?: string;
    trailer?: string;
  }[] {
    return this.config.commit_type.options.map((option) => ({
      label: option.label,
      value: option.branch_label ?? option.value,
      emoji: option.emoji,
      hint: option.hint,
      trailer: option.trailer,
    }));
  }

  #run_post_effects(prompt_result: string): void {
    this.branch_state.type = prompt_result;
  }
}
