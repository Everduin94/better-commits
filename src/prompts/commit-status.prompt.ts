import * as p from "@clack/prompts";
import color from "picocolors";
import { addNewLine } from "../utils";
import { a_for_all_message } from "../utils/messages";
import { git_add, git_status } from "../git";
import { autocompleteMultiselect } from "./autocomplete-multiselect";
import { Runnable } from "./runnable";

export class CommitStatusPrompt extends Runnable {
  async run(): Promise<void> {
    if (!this.#is_enabled) return;

    const status = git_status();
    this.#log_status(status);

    if (status.work_tree.length) {
      const selected_for_staging = await this.#select_for_staging(
        status.work_tree,
      );
      if (selected_for_staging.length) {
        git_add(selected_for_staging);
      }
    }

    this.#ensure_staged_changes();
  }

  get #is_enabled(): boolean {
    return this.config.check_status;
  }

  #log_status(status: { index: string[]; work_tree: string[] }): void {
    p.log.step(color.black(color.bgGreen(" Checking Git Status ")));

    const staged_files = this.#format_files(status.index, color.green);
    p.log.success("Changes to be committed:\n" + staged_files);

    if (!status.work_tree.length) return;
    const unstaged_files = this.#format_files(status.work_tree, color.red);
    p.log.error("Changes not staged for commit:\n" + unstaged_files);
  }

  #format_files(files: string[], colorize: (value: string) => string): string {
    return files.reduce(
      (acc, curr, index) => colorize(acc + curr + addNewLine(files, index)),
      "",
    );
  }

  async #select_for_staging(work_tree: string[]): Promise<string[]> {
    const selected_for_staging = (this.config.check_status_autocomplete
      ? await autocompleteMultiselect({
          message: "Some files have not been staged, add them now?",
          options: work_tree.map((v) => ({ value: v, label: v })),
          required: false,
        })
      : await p.multiselect({
          message: a_for_all_message("Some files have not been staged, add them now?"),
          options: work_tree.map((v) => ({ value: v, label: v })),
          required: false,
        })) as string[];

    if (p.isCancel(selected_for_staging)) process.exit(0);
    return selected_for_staging;
  }

  #ensure_staged_changes(): void {
    const updated_status = git_status();
    if (updated_status.index.length) return;

    p.log.error(
      color.red(
        'no changes added to commit (use "git add" and/or "git commit -a")',
      ),
    );
    process.exit(0);
  }
}
