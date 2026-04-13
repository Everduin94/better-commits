import * as v from "valibot";
import { COMMIT_STATE_ENTRIES, Config } from "../valibot-state";
import { get_commit_title_size } from "./commit-title-size";

function format_allowed_values(values: string[]): string {
  const printable_values = values.map((value) =>
    value === "" ? '"" (none)' : `"${value}"`,
  );
  return printable_values.join(", ");
}

export function create_strict_commit_state(
  config: v.Output<typeof Config>,
): v.ObjectSchema<typeof COMMIT_STATE_ENTRIES, undefined> {
  const type_values = config.commit_type.options.map((option) => option.value);
  const scope_values = config.commit_scope.options.map(
    (option) => option.value,
  );

  return v.object(COMMIT_STATE_ENTRIES, [
    v.custom(
      (state) => !state.type || type_values.includes(state.type),
      (ctx) => {
        const input = ctx.input as { type?: string };
        const received = input.type ? `"${input.type}"` : "(empty)";
        return `Invalid --type ${received}. Valid types: ${format_allowed_values(type_values)}.`;
      },
    ),
    v.custom(
      (state) =>
        !state.scope ||
        config.commit_scope.custom_scope ||
        scope_values.includes(state.scope),
      (ctx) => {
        const input = ctx.input as { scope?: string };
        const received = input.scope ? `"${input.scope}"` : "(empty)";
        return `Invalid --scope ${received}. Valid scopes: ${format_allowed_values(scope_values)}${config.commit_scope.custom_scope ? ", or any custom scope value" : ""}.`;
      },
    ),
    v.custom(
      (state) => !!state.title?.trim(),
      "Missing --title. Provide a non-empty commit title.",
    ),
    v.custom(
      (state) =>
        get_commit_title_size(state, {
          include_ticket: config.check_ticket.add_to_title,
        }) <= config.commit_title.max_size,
      (ctx) => {
        const input = ctx.input as {
          type?: string;
          scope?: string;
          ticket?: string;
          title?: string;
        };
        const size = get_commit_title_size(input, {
          include_ticket: config.check_ticket.add_to_title,
        });
        return `Title exceeds max width. Current size is ${size}, max is ${config.commit_title.max_size} (includes type, scope, and ticket when enabled).`;
      },
    ),
    v.custom(
      (state) => !config.commit_body.required || !!state.body?.trim(),
      "Missing --body. commit_body.required is enabled in config.",
    ),
    v.custom(
      (state) => !state.closes || !!state.ticket,
      'Invalid footer values: --closes requires --ticket (for example: --ticket "ABC-123").',
    ),
    v.custom(
      (state) => !state.breaking_body || !!state.breaking_title,
      "Invalid breaking change values: --breaking-body requires --breaking-title.",
    ),
    v.custom(
      (state) => !state.deprecates_body || !!state.deprecates_title,
      "Invalid deprecation values: --deprecates-body requires --deprecates-title.",
    ),
  ]);
}
