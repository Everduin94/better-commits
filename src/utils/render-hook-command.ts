import { InferOutput } from "valibot";
import { BranchState } from "../valibot-state";

const HOOK_TEMPLATE =
  /(?<!\{)\{\{(USER|TYPE|SCOPE|DESCRIPTION|TICKET|BRANCH-VERSION|CHECKOUT)\}\}(?!\})/g;

export function render_hook_command(
  command: string,
  branch_state: InferOutput<typeof BranchState>,
): string {
  const values = {
    USER: branch_state.user,
    TYPE: branch_state.type,
    SCOPE: branch_state.scope,
    DESCRIPTION: branch_state.description,
    TICKET: branch_state.ticket,
    "BRANCH-VERSION": branch_state.version,
    CHECKOUT: branch_state.checkout,
  } as const;

  return command.replace(HOOK_TEMPLATE, (_, token: keyof typeof values) =>
    quote_shell_value(values[token]),
  );
}

function quote_shell_value(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
