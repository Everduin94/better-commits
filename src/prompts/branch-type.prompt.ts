import * as p from "@clack/prompts";
import { BranchRunnable } from "./branch-runnable";

export class BranchTypePrompt extends BranchRunnable {
  async run(): Promise<void> {
    if (!this.#is_enabled) return;

    const branch_type = await p.select({
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
    return this.branch_state.type || this.config.commit_type.initial_value;
  }

  get #options(): {
    label?: string | undefined;
    value: string;
    emoji?: string;
    hint?: string;
    trailer?: string;
  }[] {
    return this.config.commit_type.options;
  }

  #run_post_effects(prompt_result: string): void {
    this.branch_state.type = prompt_result;
  }
}
