import * as v from "valibot";

export const CUSTOM_SCOPE_KEY: "custom" = "custom";
export const FOOTER_OPTION_VALUES: v.Output<typeof V_FOOTER_OPTIONS>[] = [
  "closes",
  "trailer",
  "breaking-change",
  "deprecated",
  "custom",
];
export const V_BRANCH_ACTIONS = v.picklist(["branch", "worktree"]);
export const V_FOOTER_OPTIONS = v.picklist([
  "closes",
  "trailer",
  "breaking-change",
  "deprecated",
  "custom",
]);
export const V_BRANCH_FIELDS = v.picklist([
  "user",
  "version",
  "type",
  "ticket",
  "description",
]);
export const V_BRANCH_CONFIG_FIELDS = v.picklist([
  "branch_user",
  "branch_version",
  "branch_type",
  "branch_ticket",
  "branch_description",
]);
export const BRANCH_ORDER_DEFAULTS: v.Output<typeof V_BRANCH_FIELDS>[] = [
  "user",
  "version",
  "type",
  "ticket",
  "description",
];

export const DEFAULT_SCOPE_OPTIONS = [
  { value: "app", label: "app" },
  { value: "shared", label: "shared" },
  { value: "server", label: "server" },
  { value: "tools", label: "tools" },
  { value: "", label: "none" },
];

export const DEFAULT_TYPE_OPTIONS = [
  {
    value: "feat",
    label: "feat",
    hint: "A new feature",
    emoji: "🌟",
    trailer: "Changelog: feature",
  },
  {
    value: "fix",
    label: "fix",
    hint: "A bug fix",
    emoji: "🐛",
    trailer: "Changelog: fix",
  },
  {
    value: "docs",
    label: "docs",
    hint: "Documentation only changes",
    emoji: "📚",
    trailer: "Changelog: documentation",
  },
  {
    value: "refactor",
    label: "refactor",
    hint: "A code change that neither fixes a bug nor adds a feature",
    emoji: "🔨",
    trailer: "Changelog: refactor",
  },
  {
    value: "perf",
    label: "perf",
    hint: "A code change that improves performance",
    emoji: "🚀",
    trailer: "Changelog: performance",
  },
  {
    value: "test",
    label: "test",
    hint: "Adding missing tests or correcting existing tests",
    emoji: "🚨",
    trailer: "Changelog: test",
  },
  {
    value: "build",
    label: "build",
    hint: "Changes that affect the build system or external dependencies",
    emoji: "🚧",
    trailer: "Changelog: build",
  },
  {
    value: "ci",
    label: "ci",
    hint: "Changes to our CI configuration files and scripts",
    emoji: "🤖",
    trailer: "Changelog: ci",
  },
  {
    value: "chore",
    label: "chore",
    hint: "Other changes that do not modify src or test files",
    emoji: "🧹",
    trailer: "Changelog: chore",
  },
  { value: "", label: "none" },
];
