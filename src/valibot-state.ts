import * as v from "valibot";
import {
  BRANCH_ORDER_DEFAULTS,
  CUSTOM_SCOPE_KEY,
  DEFAULT_SCOPE_OPTIONS,
  DEFAULT_TYPE_OPTIONS,
  FOOTER_OPTION_VALUES,
  V_BRANCH_ACTIONS,
  V_BRANCH_FIELDS,
  V_FOOTER_OPTIONS,
} from "./valibot-consts";

export const Config = v.object({
  check_status: v.optional(v.boolean(), true),
  commit_type: v.transform(
    v.optional(
      v.object(
        {
          enable: v.optional(v.boolean(), true),
          initial_value: v.optional(v.string(), "feat"),
          max_items: v.optional(v.number([v.minValue(1)]), 20),
          infer_type_from_branch: v.optional(v.boolean(), true),
          append_emoji_to_label: v.optional(v.boolean(), false),
          append_emoji_to_commit: v.optional(v.boolean(), false),
          emoji_commit_position: v.optional(
            v.picklist(["Start", "After-Colon"]),
            "Start",
          ),
          options: v.optional(
            v.array(
              v.object({
                value: v.string(),
                label: v.optional(v.string()),
                hint: v.optional(v.string()),
                emoji: v.optional(v.string([v.emoji()]), undefined),
                trailer: v.optional(v.string()),
              }),
            ),
            DEFAULT_TYPE_OPTIONS,
          ),
        },
        [
          v.custom(
            (val) =>
              val.options.map((v) => v.value).includes(val.initial_value),
            (val) => {
              const input = val.input as { initial_value: string };
              return `Type: initial_value "${input.initial_value}" must exist in options`;
            },
          ),
        ],
      ),
      {},
    ),
    (val) => {
      const options =
        val.options.map((v) => ({
          ...v,
          label:
            v.emoji && val.append_emoji_to_label
              ? `${v.emoji} ${v.label}`
              : v.label,
        })) ?? [];
      return { ...val, options };
    },
  ),
  commit_scope: v.transform(
    v.optional(
      v.object(
        {
          enable: v.optional(v.boolean(), true),
          custom_scope: v.optional(v.boolean(), false),
          max_items: v.optional(v.number([v.minValue(1)]), 20),
          initial_value: v.optional(v.string(), "app"),
          options: v.optional(
            v.array(
              v.object({
                value: v.string(),
                label: v.optional(v.string()),
                hint: v.optional(v.string()),
              }),
            ),
            DEFAULT_SCOPE_OPTIONS,
          ),
        },
        [
          v.custom(
            (val) => {
              const options = val.options.map((v) => v.value);
              if (val.custom_scope) options.push(CUSTOM_SCOPE_KEY);
              return options.includes(val.initial_value);
            },
            (val) => {
              const input = val.input as { initial_value: string };
              return `Scope: initial_value "${input.initial_value}" must exist in options`;
            },
          ),
        ],
      ),
      {},
    ),
    (val) => {
      const options = val.options.map((v) => v.value);
      if (val.custom_scope && !options.includes(CUSTOM_SCOPE_KEY)) {
        return {
          ...val,
          options: [
            ...val.options,
            {
              label: CUSTOM_SCOPE_KEY,
              value: CUSTOM_SCOPE_KEY,
              hint: "Write a custom scope",
            },
          ],
        };
      }
      return val;
    },
  ),
  check_ticket: v.optional(
    v.object({
      infer_ticket: v.optional(v.boolean(), true),
      confirm_ticket: v.optional(v.boolean(), true),
      add_to_title: v.optional(v.boolean(), true),
      append_hashtag: v.optional(v.boolean(), false),
      prepend_hashtag: v.optional(
        v.picklist(["Never", "Always", "Prompt"]),
        "Never",
      ),
      surround: v.optional(v.picklist(["", "()", "[]", "{}"]), ""),
      title_position: v.optional(
        v.picklist(["start", "end", "before-colon", "beginning"]),
        "start",
      ),
    }),
    {},
  ),
  commit_title: v.optional(
    v.object({
      max_size: v.optional(v.number([v.minValue(1)]), 70),
    }),
    {},
  ),
  commit_body: v.optional(
    v.object({
      enable: v.optional(v.boolean(), true),
      required: v.optional(v.boolean(), false),
      split_by_period: v.optional(v.boolean(), false),
    }),
    {},
  ),
  commit_footer: v.optional(
    v.object({
      enable: v.optional(v.boolean(), true),
      initial_value: v.optional(v.array(V_FOOTER_OPTIONS), []),
      options: v.optional(v.array(V_FOOTER_OPTIONS), FOOTER_OPTION_VALUES),
    }),
    {},
  ),
  breaking_change: v.optional(
    v.object({
      add_exclamation_to_title: v.optional(v.boolean(), true),
    }),
    {},
  ),
  cache_last_value: v.optional(v.boolean(), true),
  confirm_with_editor: v.optional(v.boolean(), false),
  confirm_commit: v.optional(v.boolean(), true),
  print_commit_output: v.optional(v.boolean(), true),
  branch_pre_commands: v.optional(v.array(v.string()), []),
  branch_post_commands: v.optional(v.array(v.string()), []),
  worktree_pre_commands: v.optional(v.array(v.string()), []),
  worktree_post_commands: v.optional(v.array(v.string()), []),
  branch_user: v.optional(
    v.object({
      enable: v.optional(v.boolean(), true),
      required: v.optional(v.boolean(), false),
      separator: v.optional(v.picklist(["/", "-", "_"]), "/"),
    }),
    {},
  ),
  branch_type: v.optional(
    v.object({
      enable: v.optional(v.boolean(), true),
      separator: v.optional(v.picklist(["/", "-", "_"]), "/"),
    }),
    {},
  ),
  branch_version: v.optional(
    v.object({
      enable: v.optional(v.boolean(), false),
      required: v.optional(v.boolean(), false),
      separator: v.optional(v.picklist(["/", "-", "_"]), "/"),
    }),
    {},
  ),
  branch_ticket: v.optional(
    v.object({
      enable: v.optional(v.boolean(), true),
      required: v.optional(v.boolean(), false),
      separator: v.optional(v.picklist(["/", "-", "_"]), "-"),
    }),
    {},
  ),
  branch_description: v.optional(
    v.object({
      max_length: v.optional(v.number([v.minValue(1)]), 70),
      separator: v.optional(v.picklist(["", "/", "-", "_"]), ""),
    }),
    {},
  ),
  branch_action_default: v.optional(V_BRANCH_ACTIONS, "branch"),
  branch_order: v.optional(v.array(V_BRANCH_FIELDS), BRANCH_ORDER_DEFAULTS),
  enable_worktrees: v.optional(v.boolean(), true),
  worktrees: v.optional(
    v.object({
      enable: v.optional(v.boolean(), true),
      base_path: v.optional(v.string(), ".."),
      folder_template: v.optional(
        v.string(),
        "{{repo_name}}-{{ticket}}-{{branch_description}}",
      ),
    }),
    {},
  ),
  overrides: v.optional(
    v.object({
      shell: v.optional(v.string()),
    }),
    {},
  ),
});

export const CommitState = v.optional(
  v.object({
    type: v.optional(v.string(), ""),
    scope: v.optional(v.string(), ""),
    title: v.optional(v.string(), ""),
    body: v.optional(v.string(), ""),
    closes: v.optional(v.string(), ""),
    ticket: v.optional(v.string(), ""),
    breaking_title: v.optional(v.string(), ""),
    breaking_body: v.optional(v.string(), ""),
    deprecates: v.optional(v.string(), ""),
    deprecates_title: v.optional(v.string(), ""),
    deprecates_body: v.optional(v.string(), ""),
    custom_footer: v.optional(v.string(), ""),
    trailer: v.optional(v.string(), ""),
  }),
  {},
);

export const BranchState = v.optional(
  v.object({
    user: v.optional(v.string(), ""),
    type: v.optional(v.string(), ""),
    ticket: v.optional(v.string(), ""),
    description: v.optional(v.string(), ""),
    version: v.optional(v.string(), ""),
  }),
  {},
);
