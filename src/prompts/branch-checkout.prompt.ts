import { InferOutput } from "valibot";
import { BranchRunnable } from "./branch-runnable";
import { V_BRANCH_ACTIONS } from "../valibot-consts";
import * as p from "@clack/prompts";
import { BRANCH_ACTION_OPTIONS } from "../utils";

export class BranchCheckoutPrompt extends BranchRunnable {
  async run(): Promise<void> {
    if (this.#is_enabled) {
      const branch_or_worktree = await p.select({
        message: this.#message,
        initialValue: this.#initival_values,
        options: BRANCH_ACTION_OPTIONS,
      });

      if (p.isCancel(branch_or_worktree)) process.exit();
      this.#post_run_effects(branch_or_worktree);
    }
  }

  get #message() {
    return `Checkout a branch or create a worktree?`;
  }

  get #is_enabled() {
    return this.config.worktrees.enable;
  }

  get #initival_values() {
    return this.branch_state.checkout || this.config.branch_action_default;
  }

  #post_run_effects(value: InferOutput<typeof V_BRANCH_ACTIONS>) {
    this.branch_state.checkout = value;
  }
}
