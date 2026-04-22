import * as p from "@clack/prompts";
import { optional_message } from "../utils/messages";
import { BranchRunnable } from "./branch-runnable";

export class BranchVersionPrompt extends BranchRunnable {
  async run(): Promise<void> {
    if (!this.#is_enabled) return;

    const version = await p.text({
      message: this.#message,
      placeholder: "",
      validate: (value) => this.#validate(value),
      initialValue: this.branch_state.version,
    });

    if (p.isCancel(version)) process.exit(0);
    this.#run_post_effects(version ?? "");
  }

  get #is_enabled(): boolean {
    return this.config.branch_version.enable;
  }

  get #is_required(): boolean {
    return this.config.branch_version.required;
  }

  get #message(): string {
    return this.#is_required
      ? "Type version number"
      : optional_message("Type version number");
  }

  #validate(value: string | undefined): string | undefined {
    if (this.#is_required && !value) return "Please enter a version";
  }

  #run_post_effects(prompt_result: string): void {
    this.branch_state.version = prompt_result;
  }
}
