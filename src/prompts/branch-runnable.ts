import { InferOutput } from "valibot";
import { BranchState, Config } from "../valibot-state";
import { PromptCache } from "../prompt-cache";

export abstract class BranchRunnable {
  constructor(
    protected config: InferOutput<typeof Config>,
    protected branch_state: InferOutput<typeof BranchState>,
    protected prompt_cache: PromptCache,
  ) {}

  abstract run(): Promise<void>;
}
