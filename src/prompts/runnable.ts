import { InferOutput } from "valibot";
import { CommitState, Config } from "../valibot-state";
import Configstore from "configstore";

export abstract class Runnable {
  constructor(
    protected config: InferOutput<typeof Config>,
    protected commit_state: InferOutput<typeof CommitState>,
    protected prompt_cache: Configstore,
  ) {}

  abstract run(): Promise<void>;
}
