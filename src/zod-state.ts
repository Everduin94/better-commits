import { z } from "zod";
import {
    BRANCH_ORDER_DEFAULTS,
  CUSTOM_SCOPE_KEY,
  DEFAULT_SCOPE_OPTIONS,
  DEFAULT_TYPE_OPTIONS,
  FOOTER_OPTION_VALUES,
  Z_BRANCH_ACTIONS,
  Z_BRANCH_FIELDS,
  Z_FOOTER_OPTIONS,
} from "./utils";

export const Config = z
  .object({
    check_status: z.boolean().default(true),
    commit_type: z
      .object({
        enable: z.boolean().default(true),
        initial_value: z.string().default("feat"),
        infer_type_from_branch: z.boolean().default(true),
        append_emoji_to_label: z.boolean().default(false),
        append_emoji_to_commit: z.boolean().default(false),
        options: z
          .array(
            z.object({
              value: z.string(),
              label: z.string().optional(),
              hint: z.string().optional(),
              emoji: z.string().emoji().optional(),
              trailer: z.string().optional(),
            })
          )
          .default(DEFAULT_TYPE_OPTIONS),
      })
      .default({})
      .transform((val) => {
        const options = val.options.map((v) => ({
          ...v,
          label:
            v.emoji && val.append_emoji_to_label
              ? `${v.emoji} ${v.label}`
              : v.label,
        }));
        return { ...val, options };
      })
      .refine(
        (val) => val.options.map((v) => v.value).includes(val.initial_value),
        (val) => ({
          message: `Type: initial_value "${val.initial_value}" must exist in options`,
        })
      ),
    commit_scope: z
      .object({
        enable: z.boolean().default(true),
        custom_scope: z.boolean().default(false),
        initial_value: z.string().default("app"),
        options: z
          .array(
            z.object({
              value: z.string(),
              label: z.string().optional(),
              hint: z.string().optional(),
            })
          )
          .default(DEFAULT_SCOPE_OPTIONS),
      })
      .default({})
      .transform((val) => {
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
      })
      .refine(
        (val) => {
          const options = val.options.map((v) => v.value);
          return options.includes(val.initial_value);
        },
        (val) => ({
          message: `Scope: initial_value "${val.initial_value}" must exist in options`,
        })
      ),
    check_ticket: z
      .object({
        infer_ticket: z.boolean().default(true),
        confirm_ticket: z.boolean().default(true),
        add_to_title: z.boolean().default(true),
        append_hashtag: z.boolean().default(false),
        surround: z.enum(["", "()", "[]", "{}"]).default(""),
        title_position: z.enum(["start", "end", "before-colon"]).default("start"),
      })
      .default({}),
    commit_title: z
      .object({
        max_size: z.number().positive().default(70),
      })
      .default({}),
    commit_body: z
      .object({
        enable: z.boolean().default(true),
        required: z.boolean().default(false),
      })
      .default({}),
    commit_footer: z
      .object({
        enable: z.boolean().default(true),
        initial_value: z.array(Z_FOOTER_OPTIONS).default([]),
        options: z.array(Z_FOOTER_OPTIONS).default(FOOTER_OPTION_VALUES),
      })
      .default({}),
    breaking_change: z
      .object({
        add_exclamation_to_title: z.boolean().default(true),
      })
      .default({}),
    confirm_commit: z.boolean().default(true),
    print_commit_output: z.boolean().default(true),
    branch_pre_commands: z.array(z.string()).default([]),
    branch_post_commands: z.array(z.string()).default([]),
    worktree_pre_commands: z.array(z.string()).default([]),
    worktree_post_commands: z.array(z.string()).default([]),
    branch_user: z
      .object({
        enable: z.boolean().default(true),
        required: z.boolean().default(false),
        separator: z.enum(["/", "-", "_"]).default("/"),
      })
      .default({}),
    branch_type: z
      .object({
        enable: z.boolean().default(true),
        separator: z.enum(["/", "-", "_"]).default("/"),
      })
      .default({}),
    branch_version: z
      .object({
        enable: z.boolean().default(false),
        required: z.boolean().default(false),
        separator: z.enum(["/", "-", "_"]).default("/"),
      })
      .default({}),
    branch_ticket: z
      .object({
        enable: z.boolean().default(true),
        required: z.boolean().default(false),
        separator: z.enum(["/", "-", "_"]).default("-"),
      })
      .default({}),
    branch_description: z
      .object({
        max_length: z.number().positive().default(70),
        separator: z.enum(["", "/", "-", "_"]).default(""),
      })
      .default({}),
    branch_action_default: Z_BRANCH_ACTIONS.default("branch"),
    branch_order: z.array(Z_BRANCH_FIELDS).default(BRANCH_ORDER_DEFAULTS),
    enable_worktrees: z.boolean().default(true),
    overrides: z.object({ shell: z.string().optional() }).default({}),
  })
  .default({});

export const CommitState = z
  .object({
    type: z.string().default(""),
    scope: z.string().default(""),
    title: z.string().default(""),
    body: z.string().default(""),
    closes: z.string().default(""),
    ticket: z.string().default(""),
    breaking_title: z.string().default(""),
    breaking_body: z.string().default(""),
    deprecates: z.string().default(""),
    deprecates_title: z.string().default(""),
    deprecates_body: z.string().default(""),
    custom_footer: z.string().default(""),
    trailer: z.string().default("")
  })
  .default({});

export const BranchState = z
  .object({
    user: z.string().default(""),
    type: z.string().default(""),
    ticket: z.string().default(""),
    description: z.string().default(""),
    version: z.string().default("")
  })
  .default({});
