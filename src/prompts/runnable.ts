import { InferOutput } from "valibot";
import { CommitState, Config } from "../valibot-state";
import { PromptCache } from "../prompt-cache";

export abstract class Runnable {
  constructor(
    protected config: InferOutput<typeof Config>,
    protected commit_state: InferOutput<typeof CommitState>,
    protected prompt_cache: PromptCache,
  ) {}

  abstract run(): Promise<void>;
}
