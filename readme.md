# 📝 Better Commits

A CLI to write better commits, written with Typescript | ZOD | Clack

GIF

## ✨ Features
- Follows the conventional commit guidelines
- Highly flexible configuration
- Easy install with sane defaults
- Checks git status with interactive git add
- Works globally or in your repository
- Attempts to infer ticket/issue from branch
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
 
Your first time running `better-commits`, a default config will be generated in your `$HOME` directory. -- This is your global config, it will be used if a repository-specific config cannot be found.

To create a **repository-specific config**, navigate to the root of your project.
- run `better-commits-init`

This will create a config with all of the defaults. From there, you can modify it to suit your needs.

All properties are optional, they can be removed from your configuration and will be replaced by the defaults at run-time.

### Defaults

```json
{
	"check_status": true,
	"commit_type": {
		"enable": true,
		"initial_value": "feat",
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

#### Config Validation
To simplify the CLI, some rules are enforced at runtime to make sure the program runs properly. Most of these are fairly straight forward.
- any property can be removed, but it will be replaced by the default
- if a property is a string/number/boolean in the default, it must maintain that type when modified
- the `initial_value` must be a valid value in `options`
- `commit_scope` and `commit_type` can be populated with as many or whatever options you like, as long as they maintain the shape `{value: string, label?: string, hint?: string}`
  - `hint` and `label` are optional
  - to force scope or type to be required, remove `None`
- `commit_footer` options are supplied from a fixed list, because they have specific functionality
  - thus, you can remove from that list, but you can't add custom strings to it

## Alternatives
- Commitizen

