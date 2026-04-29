export const DEFAULT_CONFIG_TEMPLATE = `{
  // Run interactive \`git status\` before composing a commit
  "check_status": true,
  "check_status_autocomplete": true,

  /* COMMIT FIELDS */
  "commit_type": {
    "enable": true,

    // Default selected type from options
    "initial_value": "feat",

    "max_items": 20,

    // Infer type from the current branch name: user/TYPE/my-branch
    "infer_type_from_branch": true,

    // Include emoji in prompt label
    "append_emoji_to_label": false,

    // Include emoji from prompt label in commit message
    "append_emoji_to_commit": false,

    // "Start" | "After-Colon"
    "emoji_commit_position": "Start",

    "autocomplete": true,

    "options": [
      {
        "value": "feat",
        "label": "feat",
        "hint": "A new feature",
        "emoji": "🌟",
        "trailer": "Changelog: feature"
      },
      {
        "value": "fix",
        "label": "fix",
        "hint": "A bug fix",
        "emoji": "🐛",
        "trailer": "Changelog: fix"
      },
      {
        "value": "docs",
        "label": "docs",
        "hint": "Documentation only changes",
        "emoji": "📚",
        "trailer": "Changelog: documentation"
      },
      {
        "value": "refactor",
        "label": "refactor",
        "hint": "A code change that neither fixes a bug nor adds a feature",
        "emoji": "🔨",
        "trailer": "Changelog: refactor"
      },
      {
        "value": "perf",
        "label": "perf",
        "hint": "A code change that improves performance",
        "emoji": "🚀",
        "trailer": "Changelog: performance"
      },
      {
        "value": "test",
        "label": "test",
        "hint": "Adding missing tests or correcting existing tests",
        "emoji": "🚨",
        "trailer": "Changelog: test"
      },
      {
        "value": "build",
        "label": "build",
        "hint": "Changes that affect the build system or external dependencies",
        "emoji": "🚧",
        "trailer": "Changelog: build"
      },
      {
        "value": "ci",
        "label": "ci",
        "hint": "Changes to our CI configuration files and scripts",
        "emoji": "🤖",
        "trailer": "Changelog: ci"
      },
      {
        "value": "chore",
        "label": "chore",
        "hint": "Other changes that do not modify src or test files",
        "emoji": "🧹",
        "trailer": "Changelog: chore"
      },
      {
        "value": "",
        "label": "none"
      }
    ]
  },

  "commit_scope": {
    "enable": true,

    // If true, users can type a scope not listed in options
    "custom_scope": false,

    // Default selected scope from options
    "initial_value": "app",

    // Infer scope from the current branch name: user/type/ticket-SCOPE-my-branch
    "infer_scope_from_branch": true,

    "max_items": 20,
    "autocomplete": true,
    "options": [
      { "value": "app", "label": "app" },
      { "value": "shared", "label": "shared" },
      { "value": "server", "label": "server" },
      { "value": "tools", "label": "tools" },
      { "value": "", "label": "none" }
    ]
  },

  "check_ticket": {
    // Infer ticket / issue from the branch name - user/type/TICKET-my-branch
    "infer_ticket": true,

    // Prompt for confirmation / edit before using an inferred ticket
    "confirm_ticket": true,

    // Add the ticket to the commit title - feat(app): TICKET my commit title
    "add_to_title": true,

    // Deprecated, prefer \`prepend_hashtag\`
    "append_hashtag": false,

    // "Never" | "Prompt" | "Always" - 12345 --> #12345
    "prepend_hashtag": "Never",

    // Wrap the ticket in the commit title: "" | "[]" | "()" | "{}"
    "surround": "",

    // "start" | "end" | "before-colon" | "beginning"
    "title_position": "start"
  },

  "commit_title": {
    // Includes total size of title + type + scope + ticket
    "max_size": 70
  },

  "commit_body": {
    "enable": true,
    "required": false,

    // Split sentences into multiple lines automatically
    "split_by_period": false
  },

  "commit_footer": {
    "enable": true,
    "initial_value": [],

    // "closes", "trailer", "breaking-change", "deprecated", "custom"
    "options": ["closes", "trailer", "breaking-change", "deprecated", "custom"]
  },

  "breaking_change": {
    // Adds \`!\` to the commit title when a breaking change is selected
    "add_exclamation_to_title": true
  },

  // Confirm / edit with $GIT_EDITOR or $EDITOR
  "confirm_with_editor": false,

  // Show a final confirmation prompt before running git commit
  "confirm_commit": true,

  // Reuse the last known value from a previous canceled or failed commit
  "cache_last_value": true,

  // Pretty-print the final commit preview before execution
  "print_commit_output": true,

  /* BRANCH FIELDS */
  // Optional shell commands to run before / after creating branches or worktrees
  "branch_pre_commands": [],
  "branch_post_commands": [],
  "worktree_pre_commands": [],
  "worktree_post_commands": [],

  "branch_user": {
    "enable": true,
    "required": false,

    // "/" | "-" | "_" - user/feat/my-branch
    "separator": "/"
  },

  "branch_type": {
    "enable": true,
    "separator": "/",
    "autocomplete": true,
  },

  "branch_scope": {
    "enable": true,
    "separator": "-",
    "autocomplete": true,
  },

  "branch_ticket": {
    "enable": true,
    "required": false,
    "separator": "-"
  },

  "branch_version": {
    "enable": false,
    "required": false,
    "separator": "/"
  },

  "branch_description": {
    // Maximum length for the description segment of the branch name
    "max_length": 70,

    // Allowed values: "" | "/" | "-" | "_"
    "separator": ""
  },

  // "branch" | "worktree"
  "branch_action_default": "branch",

  // Order of values in the final branch name
  "branch_order": ["user", "version", "type", "ticket", "scope", "description"],

  // Deprecated, prefer \`worktrees.enable\`
  "enable_worktrees": true,

  "worktrees": {
    // If false, always create a branch instead of prompting for a worktree
    "enable": true,

    // Directory where worktrees are created
    "base_path": "..",

    // Available template variables include:
    // {{repo_name}}, {{branch_description}}, {{user}}, {{type}}, {{scope}}, {{ticket}}, {{version}}
    "folder_template": "{{repo_name}}-{{ticket}}-{{branch_description}}"
  },

  /* OTHER FIELDS */
  "overrides": {
    // Useful on Windows or for shells with different multiline behavior
    "shell": "/bin/sh"
  }
}
`;
