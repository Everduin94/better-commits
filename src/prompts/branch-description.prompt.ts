import * as p from "@clack/prompts";
import { BranchRunnable } from "./branch-runnable";

export class BranchDescriptionPrompt extends BranchRunnable {
  async run(): Promise<void> {
    const description = await p.text({
      message: this.#message,
      placeholder: "",
      validate: (value) => this.#validate(value),
      initialValue: this.branch_state.description,
    });

    if (p.isCancel(description)) process.exit(0);
    this.#run_post_effects(description ?? "");
  }

  get #message(): string {
    return "Type a short description";
  }

  get #max_length(): number {
    return this.config.branch_description.max_length;
  }

  #validate(value: string | undefined): string | undefined {
    if (!value) return "Please enter a description";
    if (value.length > this.#max_length) {
      return `Exceeded max length. Description max [${this.#max_length}]`;
    }
  }

  #run_post_effects(prompt_result: string): void {
    this.branch_state.description = prompt_result
      .replace(/\s+/g, "-")
      .toLowerCase();
  }
}
