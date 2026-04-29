<h3 align="center">

![bc-gradient](https://github.com/Everduin94/better-commits/assets/14320878/2f94e6ea-a40f-4f3e-b0b2-5cc7d83a9a7d)

[![better commits is enabled](https://img.shields.io/badge/better--commits-enabled?style=for-the-badge&logo=git&color=a6e3a1&logoColor=D9E0EE&labelColor=302D41)](https://github.com/Everduin94/better-commits)
[![downloads](https://img.shields.io/npm/dt/better-commits.svg?style=for-the-badge&logo=npm&color=74c7ec&logoColor=D9E0EE&labelColor=302D41)](https://www.npmjs.com/package/better-commits)
[![discord](https://img.shields.io/badge/discord-join--discord?style=for-the-badge&logo=discord&color=cba6f7&logoColor=D9E0EE&labelColor=302D41)](https://discord.gg/grHVnZwYup)

</h3>

<p align="center">
A CLI for writing better commits, following the conventional commits specification.
</p>

<https://github.com/Everduin94/better-commits/assets/14320878/8fb15d46-17c4-4e5d-80d9-79abe0a2a00a>

## ✨ Features

- Generate conventional commits through a series of prompts
- Highly configurable with sane defaults
- Infers ticket, commit scope, and commit-type from branch for consistent & fast commits
- Consistent branch creation with flexible workflow hooks via `better-branch`
- Interactive git status/add on commit
- Preview commit messages in color
- Support for git emojis per commit-type
- Configure globally or per repository
- Config validation and error messaging
- [Lightweight](https://bundlejs.com/?q=better-commits&treeshake=%5B*%5D) (17kb)

As a side-effect of formatting messages

- Auto populate PR title / body
- Automate semantic releases
- Automate changelogs
- Automatically link & close related tickets / issues

## 📦 Installation

```sh
npm install -g better-commits
```

## 🚀 Usage

To run the CLI in your terminal:

```sh
better-commits # Create a new commit
better-branch # Create a new branch
```

`better-commits` will prompt a series of questions. These prompts will build a commit message, which you can preview, before confirming the commit. - To better understand these prompts and their intention, read [Conventional Commits Summary](https://www.conventionalcommits.org/en/v1.0.0-beta.4/#summary)

Some of the values in these prompts will be inferred by your branch name and auto populated. You can adjust this in your `.better-commits.jsonc` (or `.better-commits.json`) configuration file.

For documentation on passing commit values to `better-commits` via the CLI, see [CLI Flags](#cli-flags).

> [!TIP]
> The `--no-interactive` flag, allows automated workflows or AI agents like OpenCode and Claude Code, to use better-commits to generate consistent commit messages using less tokens.
>
> Run `better-commits --help` / `better-branch --help` for more information.

## ⚙️ Configuration

### Global

Your first time running `better-commits`, a default config will be generated in your `$HOME` directory, named `.better-commits.jsonc` (formerly `.better-commits.json`)

- This config will be used if a repository-specific config cannot be found.

### Repository

To create a **repository-specific config**, navigate to the root of your project.

- Run `better-commits-init`
- This will create a default config named `.better-commits.jsonc`
- Properties such as `confirm_with_editor` and `overrides` will prefer the global config

### 💫 Properties

> [!NOTE]<br>
> All properties are optional and can be removed from the config. They will be replaced by the default at run-time.
>
> - See `.better-commits.json` in this repository as an example

```jsonc
{
  // Run interactive `git status` before composing a commit
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
        "trailer": "Changelog: feature",
      },
      {
        "value": "fix",
        "label": "fix",
        "hint": "A bug fix",
        "emoji": "🐛",
        "trailer": "Changelog: fix",
      },
      {
        "value": "docs",
        "label": "docs",
        "hint": "Documentation only changes",
        "emoji": "📚",
        "trailer": "Changelog: documentation",
      },
      {
        "value": "refactor",
        "label": "refactor",
        "hint": "A code change that neither fixes a bug nor adds a feature",
        "emoji": "🔨",
        "trailer": "Changelog: refactor",
      },
      {
        "value": "perf",
        "label": "perf",
        "hint": "A code change that improves performance",
        "emoji": "🚀",
        "trailer": "Changelog: performance",
      },
      {
        "value": "test",
        "label": "test",
        "hint": "Adding missing tests or correcting existing tests",
        "emoji": "🚨",
        "trailer": "Changelog: test",
      },
      {
        "value": "build",
        "label": "build",
        "hint": "Changes that affect the build system or external dependencies",
        "emoji": "🚧",
        "trailer": "Changelog: build",
      },
      {
        "value": "ci",
        "label": "ci",
        "hint": "Changes to our CI configuration files and scripts",
        "emoji": "🤖",
        "trailer": "Changelog: ci",
      },
      {
        "value": "chore",
        "label": "chore",
        "hint": "Other changes that do not modify src or test files",
        "emoji": "🧹",
        "trailer": "Changelog: chore",
      },
      {
        "value": "",
        "label": "none",
      },
    ],
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
      { "value": "", "label": "none" },
    ],
  },

  "check_ticket": {
    // Infer ticket / issue from the branch name - user/type/TICKET-my-branch
    "infer_ticket": true,

    // Prompt for confirmation / edit before using an inferred ticket
    "confirm_ticket": true,

    // Add the ticket to the commit title - feat(app): TICKET my commit title
    "add_to_title": true,

    // Deprecated, prefer `prepend_hashtag`
    "append_hashtag": false,

    // "Never" | "Prompt" | "Always" - 12345 --> #12345
    "prepend_hashtag": "Never",

    // Wrap the ticket in the commit title: "" | "[]" | "()" | "{}"
    "surround": "",

    // "start" | "end" | "before-colon" | "beginning"
    "title_position": "start",
  },

  "commit_title": {
    // Includes total size of title + type + scope + ticket
    "max_size": 70,
  },

  "commit_body": {
    "enable": true,
    "required": false,

    // Split sentences into multiple lines automatically
    "split_by_period": false,
  },

  "commit_footer": {
    "enable": true,
    "initial_value": [],

    // "closes", "trailer", "breaking-change", "deprecated", "custom"
    "options": ["closes", "trailer", "breaking-change", "deprecated", "custom"],
  },

  "breaking_change": {
    // Adds `!` to the commit title when a breaking change is selected
    "add_exclamation_to_title": true,
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
    "separator": "/",
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
    "separator": "-",
  },

  "branch_version": {
    "enable": false,
    "required": false,
    "separator": "/",
  },

  "branch_description": {
    // Maximum length for the description segment of the branch name
    "max_length": 70,

    // Allowed values: "" | "/" | "-" | "_"
    "separator": "",
  },

  // "branch" | "worktree"
  "branch_action_default": "branch",

  // Order of values in the final branch name
  "branch_order": ["user", "version", "type", "ticket", "scope", "description"],

  // Deprecated, prefer `worktrees.enable`
  "enable_worktrees": true,

  "worktrees": {
    // If false, always create a branch instead of prompting for a worktree
    "enable": true,

    // Directory where worktrees are created
    "base_path": "..",

    // Available template variables include:
    // {{repo_name}}, {{branch_description}}, {{user}}, {{type}}, {{scope}}, {{ticket}}, {{version}}
    "folder_template": "{{repo_name}}-{{ticket}}-{{branch_description}}",
  },

  /* OTHER FIELDS */
  "overrides": {
    // Useful on Windows or for shells with different multiline behavior
    "shell": "/bin/sh",
  },
}
```

### 🔎 Inference

`better-commits` will attempt to infer the ticket/issue, commit-type, and commit scope from your branch name. It will auto populate the corresponding field if found.

**Ticket / Issue-Number**

- If a `STRING-NUMBER` or `NUMBER` are at the start of the branch name or after a `/`

**Commit Type**

- If a type is at the start of the branch or is followed by a `/`

**Commit Scope**

- If a configured scope appears as its own branch word, separated by `/`, `-`, or `_`
- If scope appears after a ticket, the expected shape is `TICKET-SCOPE-description`
- Empty scope values and the `custom` scope option are ignored during inference

## 🌳 Better Branch

Better branch is a secondary feature that works with better commits

- Supports consistent branch naming conventions
- Uses same type-list/prompt from your config
- Enables better-commits to infer type, scope, and ticket
- Caches your username for speedy branching
- Convenient worktree creation

To run the CLI in your terminal:

```sh
better-branch
```

### Worktree Support

`better-branch` will prompt for **Branch** or **Worktree**. The Worktree flow creates a folder/worktree from your **branch description** and a git branch inside with your **full branch name**.

> [!NOTE]<br>
> Creating a worktree named `everduin94/feat/TAC-123-add-worktrees` with the native git command would create a nested folder for each `/`. `better-branch` removes the hassle by creating 1 folder while still using the full name for the branch.

> [!TIP]
> By default, `better-branch` will create **worktrees** as a sibling folder. To change this, see `worktrees.base_path`.

### Pre/Post Branch Checkout Hooks

Optionally configure pre and post checkout commands, for example:

- checkout and rebase main before branching
- run `npm install` before branching
- run `npm run dev` after branching

See _branch_pre_commands_ and _branch_post_commands_ in default config. (or _worktree_pre_commands_ and _worktree_post_commands_ for creating worktrees)

## 💡 Tips & Tricks

### Building / Versioning

`better-commits` works with [Semantic Release](https://github.com/semantic-release/semantic-release)

- See _package.json_ and _.github/workflows/publish.yml_ for example

### Github

If you use `better-commits` to create your _first_ commit on a new branch

- When you open a PR for that branch, it will properly **auto-populate the title and body**.
- When you squash/merge, all later commits like "addressing comments" or "fixing mistake". Will be prefixed with an asterisk for easy deletion. This way, you **maintain your pretty commit even when squashing**.

If you're using Github issues to track your work, and select the `closes` footer option when writing your commit. Github will **automatically link and close** that issue when your **pr is merged**

### Changelogs

`better-commits` can append a commit trailer per commit type. This allows you to [automate change logs](https://docs.gitlab.com/ee/user/project/changelogs.html) with tools like Gitlab.

### Git

`better-commits` uses native `git` commands under the hood. So any hooks, tools, or staging should work as if it was a normal commit.

Setting `confirm_with_editor=true` will allow you to edit/confirm a commit with your editor.

- For example, to edit with Neovim: `git config --global core.editor "nvim"`
- For VS Code, `git config --global core.editor "code -n --wait"`

You can pass arguments to `git` through `better-commits` like so:

```sh
better-commits --git-dir="$HOME/.config" --work-tree="$HOME"
```

A practical example of this would be managing dotfiles, as described in this [Atlassian Article](https://www.atlassian.com/git/tutorials/dotfiles)

### CLI Flags

Use CLI flags to pass commit values directly instead of answering prompts.

- Use `--no-interactive` to skip prompts, confirmation, and editor flows. This is the recommended mode for OpenCode, Claude Code, and other coding agents.
- Use `--dry-run` to validate the generated `git commit` command without creating a commit.
- Supported commit field flags: `--type`, `--scope`, `--title`, `--body`, `--ticket`, `--closes`, `--deprecates`, `--breaking-title`, `--breaking-body`, `--deprecates-title`, `--deprecates-body`, `--custom-footer`, `--trailer`.
- Supported branch field flags: `--user`, `--type`, `--scope`, `--description`, `--ticket`, `--branch-version`, `--checkout`.

**Examples**

```sh
better-commits --no-interactive --dry-run --type feat --scope cli --title "add parser"

better-branch --no-interactive --type feat --scope cli --ticket TAC-123 --description "add parser" --checkout worktree
```

---

### 🪟 Troubleshooting Windows

#### Git Bash

`TTY initialization failed: uv_tty_init returned EBADF (bad file descriptor)`. This may happen because you're running something like git-bash on Windows. Try another terminal/command-prompt or `winpty` to see if its still an issue.

#### Multi-line

If you are having issues with multilines for commits on windows, you can override the shell via your `.better-commits.jsonc` config.

Example

```json
"overrides": {
   "shell": "c:\\Program Files\\Git\\bin\\bash.exe"
}
```

<h1 align="center">🌟 Sponsors</h1>

<h3 align="center">

[![flotes-g-2](https://github.com/Everduin94/Everduin94/assets/14320878/b0fd0aa5-ca9d-4a2d-8579-7616140927a7)](https://flotes.app)

[Markdown Notetaking - Built for Learning](https://flotes.app)

</h3>
