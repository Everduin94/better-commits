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
  config: v.InferOutput<typeof Config>,
) {
  const type_values = config.commit_type.options.map((option) => option.value);
  const scope_values = config.commit_scope.options.map(
    (option) => option.value,
  );

  return v.pipe(
    v.object(COMMIT_STATE_ENTRIES),
    v.rawCheck(({ dataset, addIssue }) => {
      if (!dataset.typed) return;

      const received = dataset.value.type ? `"${dataset.value.type}"` : "(empty)";
      if (dataset.value.type && !type_values.includes(dataset.value.type)) {
        addIssue({
          message: `Invalid --type ${received}. Valid types: ${format_allowed_values(type_values)}.`,
        });
      }
    }),
    v.rawCheck(({ dataset, addIssue }) => {
      if (!dataset.typed) return;

      const received = dataset.value.scope
        ? `"${dataset.value.scope}"`
        : "(empty)";

      if (
        dataset.value.scope &&
        !config.commit_scope.custom_scope &&
        !scope_values.includes(dataset.value.scope)
      ) {
        addIssue({
          message: `Invalid --scope ${received}. Valid scopes: ${format_allowed_values(scope_values)}.`,
        });
      }
    }),
    v.rawCheck(({ dataset, addIssue }) => {
      if (!dataset.typed || dataset.value.title.trim()) return;

      addIssue({
        message: "Missing --title. Provide a non-empty commit title.",
      });
    }),
    v.rawCheck(({ dataset, addIssue }) => {
      if (!dataset.typed) return;

      const size = get_commit_title_size(dataset.value, {
        include_ticket: config.check_ticket.add_to_title,
      });

      if (size > config.commit_title.max_size) {
        addIssue({
          message: `Title exceeds max width. Current size is ${size}, max is ${config.commit_title.max_size} (includes type, scope, and ticket when enabled).`,
        });
      }
    }),
    v.rawCheck(({ dataset, addIssue }) => {
      if (
        dataset.typed &&
        config.commit_body.required &&
        !dataset.value.body.trim()
      ) {
        addIssue({
          message: "Missing --body. commit_body.required is enabled in config.",
        });
      }
    }),
    v.rawCheck(({ dataset, addIssue }) => {
      if (dataset.typed && dataset.value.closes && !dataset.value.ticket) {
        addIssue({
          message:
            'Invalid footer values: --closes requires --ticket (for example: --ticket "ABC-123").',
        });
      }
    }),
    v.rawCheck(({ dataset, addIssue }) => {
      if (
        dataset.typed &&
        dataset.value.breaking_body &&
        !dataset.value.breaking_title
      ) {
        addIssue({
          message:
            "Invalid breaking change values: --breaking-body requires --breaking-title.",
        });
      }
    }),
    v.rawCheck(({ dataset, addIssue }) => {
      if (
        dataset.typed &&
        dataset.value.deprecates_body &&
        !dataset.value.deprecates_title
      ) {
        addIssue({
          message:
            "Invalid deprecation values: --deprecates-body requires --deprecates-title.",
        });
      }
    }),
  );
}
