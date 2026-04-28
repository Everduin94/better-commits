import * as p from "@clack/prompts";
import { CUSTOM_SCOPE_KEY } from "../valibot-consts";
import { BranchRunnable } from "./branch-runnable";

export class BranchScopePrompt extends BranchRunnable {
  async run(): Promise<void> {
    if (!this.#is_enabled) return;

    const prompt_type = this.config.branch_scope.autocomplete
      ? p.autocomplete
      : p.select;
    const branch_scope = await prompt_type({
      message: this.#message,
      initialValue: this.#initial_value,
      options: this.#options,
    });

    if (p.isCancel(branch_scope)) process.exit(0);
    await this.#run_post_effects(branch_scope);
  }

  get #is_enabled(): boolean {
    return this.config.branch_scope.enable;
  }

  get #message(): string {
    return "Select a branch scope";
  }

  get #initial_value(): string {
    return this.branch_state.scope || this.config.commit_scope.initial_value;
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

  async #run_post_effects(prompt_result: string): Promise<void> {
    let branch_scope_value = prompt_result;
    if (branch_scope_value === CUSTOM_SCOPE_KEY && this.#custom_scope_enabled) {
      const branch_scope = await p.text({
        message: "Write a custom scope",
        placeholder: "",
      });
      if (p.isCancel(branch_scope)) process.exit(0);
      branch_scope_value = branch_scope ?? "";
    }

    this.branch_state.scope = branch_scope_value;
  }
}
