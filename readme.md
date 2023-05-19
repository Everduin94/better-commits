# Better Commits

[![better commits is enabled](https://img.shields.io/badge/better--commits-enabled?style=for-the-badge&logo=git&color=a6e3a1&logoColor=D9E0EE&labelColor=302D41)](https://github.com/Everduin94/better-commits)
[![downloads](https://img.shields.io/npm/dt/better-commits.svg?style=for-the-badge&logo=npm&color=74c7ec&logoColor=D9E0EE&labelColor=302D41)](https://www.npmjs.com/package/better-commits)
<a href="https://github.com/everduin94/better-commits/issues">
		<img alt="Issues" src="https://img.shields.io/github/issues/everduin94/better-commits?style=for-the-badge&logo=gitbook&color=cba6f7&logoColor=D9E0EE&labelColor=302D41"></a>

A CLI for writing better commits, following the conventional commit guidelines, written with Typescript | ZOD | Clack

https://user-images.githubusercontent.com/14320878/225088948-43073a0e-400c-4c5f-a6e3-4f4961cfe43d.mov

## ✨ Features
- Follows the conventional commit guidelines
- Highly flexible configuration
- Easy install with sane defaults
- Checks git status with interactive git add
- Works globally or in your repository
- Attempts to infer ticket/issue and type from branch
- Pretty prints preview in color
- Support for git emojis per type
- Consistent branch naming CLI via `better-branch`
- Validates config at runtime

## 📦 Installation
 
```sh
npm install -g better-commits
```

## 🚀 Usage

When you're ready to commit. To run the CLI in your terminal:

```sh
better-commits
# or
npx better-commits
```

It will prompt a series of questions. These prompts will build a commit message, which you can preview, before confirming the commit.

To better understand these prompts and their intention, read [Conventional Commits Summary](https://www.conventionalcommits.org/en/v1.0.0-beta.4/#summary)

To modify, these prompts, see `configuration`.

## ⚙️ Configuration
 
 
### Global

Your first time running `better-commits`, a default config will be generated in your `$HOME` directory, named `.better-commits.json`
- This config will be used if a repository-specific config cannot be found.

### Repository

To create a **repository-specific config**, navigate to the root of your project.
- run `better-commits-init`
- This will create a default config named `.better-commits.json`

All properties are optional, they can be removed from your configuration and will be replaced by the defaults at run-time.

### Defaults

```json
{
    "check_status": true,
    "commit_type": {
        "enable": true,
        "initial_value": "feat",
        "infer_type_from_branch": true,
        "append_emoji_to_label": false,
        "append_emoji_to_commit": false,
        "options": [
            {
                "value": "feat",
                "label": "feat",
                "hint": "A new feature",
                "emoji": "✨"
            },
            {
                "value": "fix",
                "label": "fix",
                "hint": "A bug fix",
                "emoji": "🐛"
            },
            {
                "value": "docs",
                "label": "docs",
                "hint": "Documentation only changes",
                "emoji": "📚"
            },
            {
                "value": "refactor",
                "label": "refactor",
                "hint": "A code change that neither fixes a bug nor adds a feature",
                "emoji": "🔨"
            },
            {
                "value": "perf",
                "label": "perf",
                "hint": "A code change that improves performance",
                "emoji": "🚀"
            },
            {
                "value": "test",
                "label": "test",
                "hint": "Adding missing tests or correcting existing tests",
                "emoji": "🚨"
            },
            {
                "value": "build",
                "label": "build",
                "hint": "Changes that affect the build system or external dependencies",
                "emoji": "🚧"
            },
            {
                "value": "ci",
                "label": "ci",
                "hint": "Changes to our CI configuration files and scripts",
                "emoji": "🤖"
            },
            {
                "value": "chore",
                "label": "chore",
                "hint": "Other changes that do not modify src or test files",
                "emoji": "🧹"
            },
            {
                "value": "",
                "label": "none"
            }
        ]
    },
    "commit_scope": {
        "enable": true,
        "custom_scope": false,
        "initial_value": "app",
        "options": [
            {
                "value": "app",
                "label": "app"
            },
            {
                "value": "shared",
                "label": "shared"
            },
            {
                "value": "server",
                "label": "server"
            },
            {
                "value": "tools",
                "label": "tools"
            },
            {
                "value": "",
                "label": "none"
            }
        ]
    },
    "check_ticket": {
        "infer_ticket": true,
        "confirm_ticket": true,
        "add_to_title": true,
        "append_hashtag": false,
        "title_position": "start"
    },
    "commit_title": {
        "max_size": 70
    },
    "commit_body": {
        "enable": true,
        "required": false
    },
    "commit_footer": {
        "enable": true,
        "initial_value": [],
        "options": [
            "closes",
            "breaking-change",
            "deprecated",
            "custom"
        ]
    },
    "breaking_change": {
        "add_exclamation_to_title": true
    },
    "confirm_commit": true,
    "print_commit_output": true,
    "branch_pre_commands": [],
    "branch_post_commands": [],
    "branch_user": {
        "enable": true,
        "required": false,
        "separator": "/"
    },
    "branch_type": {
        "enable": true,
        "separator": "/"
    },
    "branch_ticket": {
        "enable": true,
        "required": false,
        "separator": "-"
    },
    "branch_description": {
        "max_length": 70
    }
}
```

### ✅ Config Validation

Any property can be removed from the config, it will be replaced by the default at run-time
- See `.better-commits.json` in this repository as an example

#### Types
if a property is a string/number/boolean in the default, it must stay that type

#### Scope & Type
The `initial_value` must be a `value` in the corresponding `options`

`commit_scope` and `commit_type` can be populated with as many or whatever options you like
- `hint` and `label` are optional
- to make scope or type required, remove `None`
  
#### Footer
`commit_footer` options are supplied from a fixed list, because they have specific functionality
  - You can remove from that list, but you can't add custom values to it

TODO: Add table explaining properties

### 🔎 Inference

`better-commits` will attempt to infer the ticket/issue and the type from your branch name. It will auto populate the corresponding field if found. 

**Ticket**
- `STRING-NUMBER` -- If a string-number is at the start of the branch
- `/STRING-NUMBER` -- If a string-number comes after a /

**Issue**
- `NUMBER` -- If a number is at the start of the branch
- `/NUMBER` -- If a number comes after a /

**Type**
- `TYPE-` -- If a type is at the start of the branch
- `TYPE/` -- If a slash comes after the type
- `-TYPE-` -- If a type is between two dashes

## 🌳 Better Branch

Runs a prompt to checkout a branch with consistent naming conventions
- `better-commits` can then infer ticket/issue and type from the branch

In your terminal

```sh
better-branch
```

### Pre/Post Checkout Hooks

Optionally configure pre and post checkout commands, for example:
- checkout and rebase main before branching
- run `npm install` before branching
- run `npm run dev` after branching

See *branch_pre_commands* and *branch_post_commands* in default config.

## 😮 Mildly Interesting

### Building / Versioning
`better-commits` works with [Semantic Release](https://github.com/semantic-release/semantic-release)
- See *package.json* and *.github/workflows/publish.yml* for example

### Github
if you use `better-commits` to create your *first* commit on a new branch
- when you open a PR for that branch, it will properly **auto-populate the title and body**.
- when you squash/merge, all later commits like "addressing comments" or "fixing mistake". Will be prefixed with an asterisk for easy deletion. This way, you **maintain your pretty commit even when squashing**.

if you're using Github issues to track your work, and select the `closes` footer option when writing your commit. Github will **automatically link and close** that issue when your **pr is merged**

### Fun Facts
[better-commits](https://packagephobia.com/result?p=better-commits) is much smaller than its alternative [commitizen](https://packagephobia.com/result?p=commitizen)

`better-commits` uses native `git` commands under the hood. So any hooks, tools, or staging should work as if it was a normal commit.

You can add this badge to your repository to display that you're using a better-commits repository config 
```
[![better commits is enabled](https://img.shields.io/badge/better--commits-enabled?style=for-the-badge&logo=git&color=a6e3a1&logoColor=D9E0EE&labelColor=302D41)](https://github.com/Everduin94/better-commits)
```

[![better commits is enabled](https://img.shields.io/badge/better--commits-enabled?style=for-the-badge&logo=git&color=a6e3a1&logoColor=D9E0EE&labelColor=302D41)](https://github.com/Everduin94/better-commits)

---

## ❓ Troubleshooting

`TTY initialization failed: uv_tty_init returned EBADF (bad file descriptor)`. This may happen because you're running something like git-bash on Windows. Try another terminal/command-prompt or `winpty` to see if its still an issue.

## Alternatives
- Commitizen

