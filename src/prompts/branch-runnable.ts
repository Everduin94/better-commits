import { InferOutput } from "valibot";
import { BranchState, Config } from "../valibot-state";
import Configstore from "configstore";

export abstract class BranchRunnable {
  constructor(
    protected config: InferOutput<typeof Config>,
    protected branch_state: InferOutput<typeof BranchState>,
    protected prompt_cache: Configstore,
  ) {}

  abstract run(): Promise<void>;
}
