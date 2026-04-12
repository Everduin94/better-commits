import { Output } from "valibot";
import { CommitState, Config } from "../valibot-state";
import Configstore from "configstore";

export abstract class Runnable {
  constructor(
    protected config: Output<typeof Config>,
    protected commit_state: Output<typeof CommitState>,
    protected prompt_cache: Configstore,
  ) {}

  abstract run(): Promise<void>;
}
