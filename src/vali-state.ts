import {
    array,
    boolean,
    custom,
    emoji,
    minValue,
    number,
    object,
    optional,
    picklist,
    string,
    transform
} from "valibot";
import { BRANCH_ORDER_DEFAULTS, CUSTOM_SCOPE_KEY, DEFAULT_SCOPE_OPTIONS, DEFAULT_TYPE_OPTIONS, FOOTER_OPTION_VALUES, V_BRANCH_ACTIONS, V_BRANCH_FIELDS, V_FOOTER_OPTIONS } from "./utils";

export const Config = object({
    check_status: optional(boolean(), true),
    commit_type: transform(
        optional(
            object(
                {
                    enable: optional(boolean(), true),
                    initial_value: optional(string(), "feat"),
                    infer_type_from_branch: optional(boolean(), true),
                    append_emoji_to_label: optional(boolean(), false),
                    append_emoji_to_commit: optional(boolean(), false),
                    options: optional(
                        array(
                            object({
                                value: string(),
                                label: optional(string()),
                                hint: optional(string()),
                                emoji: optional(string([emoji()]), undefined),
                                trailer: optional(string()),
                            })
                        ),
                        DEFAULT_TYPE_OPTIONS
                    ),
                },
                [
                    custom(
                        (val) => val.options.map((v) => v.value).includes(val.initial_value),
                        // @ts-ignore
                        (val) => `Type: initial_value "${val.initial_value}" must exist in options`
                    ),
                ]
            ),
            {}
        ),
        (val) => {
            const options = val.options.map((v) => ({
                ...v,
                label:
                    v.emoji && val.append_emoji_to_label
                        ? `${v.emoji} ${v.label}`
                        : v.label,
            }));
            return { ...val, options };
        }
    ),
    commit_scope: transform(optional(
        object({
            enable: optional(boolean(), true),
            custom_scope: optional(boolean(), false),
            initial_value: optional(string(), "app"),
            options: optional(
                array(
                    object({
                        value: string(),
                        label: optional(string()),
                        hint: optional(string()),
                    })
                ),
                DEFAULT_SCOPE_OPTIONS
            ),
        },
            [
                custom(
                    (val) => {
                        const options = val.options.map((v) => v.value);
                        return options.includes(val.initial_value);
                    },
                    // @ts-ignore
                    (val) => `Scope: initial_value "${val.initial_value}" must exist in options`
                )
            ]
        ),
        {}
    ), (val) => {
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
    }),
    check_ticket: optional(
        object({
            infer_ticket: optional(boolean(), true),
            confirm_ticket: optional(boolean(), true),
            add_to_title: optional(boolean(), true),
            append_hashtag: optional(boolean(), false),
            prepend_hashtag: optional(
                picklist(["Never", "Always", "Prompt"]),
                "Never"
            ),
            surround: optional(picklist(["", "()", "[]", "{}"]), ""),
            title_position: optional(
                picklist(["start", "end", "before-colon", "beginning"]),
                "start"
            ),
        }),
        {}
    ),
    commit_title: optional(
        object({
            max_size: optional(number([minValue(1)]), 70),
        }),
        {}
    ),
    commit_body: optional(
        object({
            enable: optional(boolean(), true),
            required: optional(boolean(), false),
        }),
        {}
    ),
    commit_footer: optional(
        object({
            enable: optional(boolean(), true),
            initial_value: optional(array(V_FOOTER_OPTIONS), []),
            options: optional(array(V_FOOTER_OPTIONS), FOOTER_OPTION_VALUES),
        }),
        {}
    ),
    breaking_change: optional(
        object({
            add_exclamation_to_title: optional(boolean(), false),
        }),
        {}
    ),
    confirm_with_editor: optional(boolean(), false),
    confirm_commit: optional(boolean(), true),
    print_commit_output: optional(boolean(), true),
    branch_pre_commands: optional(array(string()), []),
    branch_post_commands: optional(array(string()), []),
    worktree_pre_commands: optional(array(string()), []),
    worktree_post_commands: optional(array(string()), []),
    branch_user: optional(
        object({
            enable: optional(boolean(), true),
            required: optional(boolean(), false),
            separator: optional(picklist(["/", "-", "_"]), "/"),
        }),
        {}
    ),
    branch_type: optional(
        object({
            enable: optional(boolean(), true),
            separator: optional(picklist(["/", "-", "_"]), "/"),
        }),
        {}
    ),
    branch_version: optional(
        object({
            enable: optional(boolean(), true),
            required: optional(boolean(), false),
            separator: optional(picklist(["/", "-", "_"]), "/"),
        }),
        {}
    ),
    branch_ticket: optional(
        object({
            enable: optional(boolean(), true),
            required: optional(boolean(), false),
            separator: optional(picklist(["/", "-", "_"]), "/"),
        }),
        {}
    ),
    branch_description: optional(
        object({
            max_length: optional(number([minValue(1)]), 70),
            separator: optional(picklist(["", "/", "-", "_"]), ""),
        }),
        {}
    ),
    branch_action_default: optional(V_BRANCH_ACTIONS, "branch"),
    branch_order: optional(array(V_BRANCH_FIELDS), BRANCH_ORDER_DEFAULTS),
    enable_worktrees: optional(boolean(), true),
    overrides: optional(
        object({
            shell: optional(string()),
        }),
        {}
    ),
});

export const CommitState = optional(
    object({
        type: optional(string(), ""),
        scope: optional(string(), ""),
        title: optional(string(), ""),
        body: optional(string(), ""),
        closes: optional(string(), ""),
        ticket: optional(string(), ""),
        breaking_title: optional(string(), ""),
        breaking_body: optional(string(), ""),
        deprecates: optional(string(), ""),
        deprecates_title: optional(string(), ""),
        deprecates_body: optional(string(), ""),
        custom_footer: optional(string(), ""),
        trailer: optional(string(), ""),
    }),
    {}
);

export const BranchState = optional(
    object({
        user: optional(string(), ""),
        type: optional(string(), ""),
        ticket: optional(string(), ""),
        description: optional(string(), ""),
        version: optional(string(), ""),
    }),
    {}
);
