import * as p from "@clack/prompts";
import { optional_message } from "../utils/messages";
import { BranchRunnable } from "./branch-runnable";

export class BranchTicketPrompt extends BranchRunnable {
  async run(): Promise<void> {
    if (!this.#is_enabled) return;

    const ticket = await p.text({
      message: this.#message,
      placeholder: "",
      validate: (value) => this.#validate(value),
      initialValue: this.branch_state.ticket,
    });

    if (p.isCancel(ticket)) process.exit(0);
    this.#run_post_effects(ticket ?? "");
  }

  get #is_enabled(): boolean {
    return this.config.branch_ticket.enable;
  }

  get #is_required(): boolean {
    return this.config.branch_ticket.required;
  }

  get #message(): string {
    return this.#is_required
      ? "Type ticket / issue number"
      : optional_message("Type ticket / issue number");
  }

  #validate(value: string | undefined): string | undefined {
    if (this.#is_required && !value) return "Please enter a ticket / issue";
  }

  #run_post_effects(prompt_result: string): void {
    this.branch_state.ticket = prompt_result;
  }
}
