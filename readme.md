# 📝 Better Commits

A CLI for writing better commits, following the conventional commit guidelines, written with Typescript | ZOD | Clack

https://user-images.githubusercontent.com/14320878/224050591-c6035ac5-1120-40c8-97b0-c33ebcb11b3e.mov

## ✨ Features
- Follows the conventional commit guidelines
- Highly flexible configuration
- Easy install with sane defaults
- Checks git status with interactive git add
- Works globally or in your repository
- Attempts to infer ticket/issue and type from branch
- Pretty prints preview in color
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
 
Your first time running `better-commits`, a default config will be generated in your `$HOME` directory, named `.better-commits.json`. -- This is your global config, it will be used if a repository-specific config cannot be found.

To create a **repository-specific config**, navigate to the root of your project.
- run `better-commits-init`

This will create a config named `.better-commits.json` with all of the defaults. From there, you can modify it to suit your needs.

All properties are optional, they can be removed from your configuration and will be replaced by the defaults at run-time.

### Defaults

```json
{
	"check_status": true,
	"commit_type": {
		"enable": true,
		"initial_value": "feat",
		"infer_type_from_branch": true,
		"options": [
			{
				"value": "feat",
				"label": "feat"
			},
			{
				"value": "fix",
				"label": "fix"
			},
			{
				"value": "docs",
				"label": "docs"
			},
			{
				"value": "refactor",
				"label": "refactor"
			},
			{
				"value": "perf",
				"label": "perf"
			},
			{
				"value": "test",
				"label": "test"
			},
			{
				"value": "",
				"label": "none"
			}
		]
	},
	"commit_scope": {
		"enable": true,
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
		"append_hashtag": false
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
			"deprecated"
		]
	},
	"breaking_change": {
		"add_exclamation_to_title": true
	},
	"confirm_commit": true
}
```

#### ✅ Config Validation
To simplify the CLI, some rules are enforced at runtime to make sure the program runs properly.
- any property can be removed from the config, it will be replaced by the default at run-time
- if a property is a string/number/boolean in the default, it must stay that type
- the `initial_value` must be a valid value in the corresponding `options`
- `commit_scope` and `commit_type` can be populated with as many or whatever options
  - must maintain the shape `{value: string, label?: string, hint?: string}`
  - `hint` and `label` are optional
  - to force scope or type to be required, remove `None`
- `commit_footer` options are supplied from a fixed list, because they have specific functionality
  - thus, you can remove from that list, but you can't add custom values to it

#### 🔎 Inference

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

## 😮 Mildly Interesting
- `better-commits` works with [Semantic Release](https://github.com/semantic-release/semantic-release)
- if you use `better-commits` to create your *first* commit on a new branch, when you open a PR for that branch, it will properly **auto-populate the title and body**.
- when you squash / merge with github, if `better-commits` is your *first* commit, all later commits like "addressing comments", "fixing mistake". Will be prefixed with an asterisk for easy deletion. This way you **maintain your pretty commit even when squashing**.
- if you use a branch name like the ones below, better-commits will be able to infer your ticket/issue and type
  - `TYPE/TICKET-description`
  - `USER/TYPE/TICKET-description`
- if you're using Github issues to track your work, and select the `closes` footer option when writing your commit. Github will **automatically link and close** that issue when your **pr is merged**
- [better-commits](https://packagephobia.com/result?p=better-commits) is much smaller than its alternative [commitizen](https://packagephobia.com/result?p=commitizen)

## ❓ Troubleshooting

`TTY initialization failed: uv_tty_init returned EBADF (bad file descriptor)`. This may happen because you're running something like git-bash on Windows. Try another terminal/command-prompt or `winpty` to see if its still an issue.

## Alternatives
- Commitizen

