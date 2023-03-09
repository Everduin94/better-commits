#! /usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var p = __toESM(require("@clack/prompts"));
var import_picocolors2 = __toESM(require("picocolors"));
var import_simple_git = require("simple-git");
var import_fs = __toESM(require("fs"));
var import_child_process = require("child_process");
var import_zod_validation_error = require("zod-validation-error");

// src/zod-state.ts
var import_zod2 = require("zod");

// src/utils.ts
var import_os = require("os");
var import_zod = require("zod");
var import_picocolors = __toESM(require("picocolors"));
var CONFIG_FILE_NAME = ".better-commits.json";
var SPACE_TO_SELECT = `${import_picocolors.default.dim("(<space> to select)")}`;
var OPTIONAL_PROMPT = `${import_picocolors.default.dim("(optional)")}`;
var REGEX_SLASH_TAG = new RegExp(/\/(\w+-\d+)/);
var REGEX_START_TAG = new RegExp(/^(\w+-\d+)/);
var REGEX_SLASH_NUM = new RegExp(/\/(\d+)/);
var REGEX_START_NUM = new RegExp(/^(\d+)/);
var DEFAULT_TYPE_OPTIONS = [
  { value: "feat", label: "feat" },
  { value: "bug", label: "bug" },
  { value: "docs", label: "docs" },
  { value: "", label: "none" }
];
var DEFAULT_SCOPE_OPTIONS = [
  { value: "app", label: "app" },
  { value: "ui", label: "ui" },
  { value: "server", label: "server" },
  { value: "", label: "none" }
];
var COMMIT_FOOTER_OPTIONS = [
  { value: "closes", label: "closes <issue/ticket>", hint: "Attempts to infer ticket from branch" },
  { value: "breaking-change", label: "breaking change", hint: "Add breaking change" },
  { value: "deprecated", label: "deprecated", hint: "Add deprecated change" }
];
var Z_FOOTER_OPTIONS = import_zod.z.enum(["closes", "breaking-change", "deprecated"]);
var FOOTER_OPTION_VALUES = ["closes", "breaking-change", "deprecated"];
function get_default_config_path() {
  return (0, import_os.homedir)() + "/" + CONFIG_FILE_NAME;
}
function check_missing_stage(stats) {
  return stats.files.filter((f) => f.index.trim() === "" || f.index === "?").map((f) => f.path);
}
function addNewLine(arr, i) {
  return i === arr.length - 1 ? "" : "\n";
}
function clean_commit_title(title) {
  const title_trimmed = title.trim();
  const remove_period = title_trimmed.endsWith(".");
  if (remove_period) {
    return title_trimmed.substring(0, title_trimmed.length - 1).trim();
  }
  return title.trim();
}

// src/zod-state.ts
var Config = import_zod2.z.object({
  check_status: import_zod2.z.boolean().default(true),
  commit_type: import_zod2.z.object({
    enable: import_zod2.z.boolean().default(true),
    initial_value: import_zod2.z.string().default("feat"),
    options: import_zod2.z.array(import_zod2.z.object({
      value: import_zod2.z.string(),
      label: import_zod2.z.string().optional(),
      hint: import_zod2.z.string().optional()
    })).default(DEFAULT_TYPE_OPTIONS)
  }).default({}).refine((val) => {
    const options = val.options.map((v) => v.value);
    return options.includes(val.initial_value);
  }, (val) => ({ message: `Type: initial_value "${val.initial_value}" must exist in options` })),
  commit_scope: import_zod2.z.object({
    enable: import_zod2.z.boolean().default(true),
    initial_value: import_zod2.z.string().default("app"),
    options: import_zod2.z.array(import_zod2.z.object({
      value: import_zod2.z.string(),
      label: import_zod2.z.string().optional(),
      hint: import_zod2.z.string().optional()
    })).default(DEFAULT_SCOPE_OPTIONS)
  }).default({}).refine((val) => {
    const options = val.options.map((v) => v.value);
    return options.includes(val.initial_value);
  }, (val) => ({ message: `Scope: initial_value "${val.initial_value}" must exist in options` })),
  check_ticket: import_zod2.z.object({
    infer_ticket: import_zod2.z.boolean().default(true),
    confirm_ticket: import_zod2.z.boolean().default(true),
    add_to_title: import_zod2.z.boolean().default(true)
  }).default({}),
  commit_title: import_zod2.z.object({
    max_size: import_zod2.z.number().positive().default(70)
  }).default({}),
  commit_body: import_zod2.z.object({
    enable: import_zod2.z.boolean().default(true),
    required: import_zod2.z.boolean().default(false)
  }).default({}),
  commit_footer: import_zod2.z.object({
    enable: import_zod2.z.boolean().default(true),
    initial_value: import_zod2.z.array(Z_FOOTER_OPTIONS).default([]),
    options: import_zod2.z.array(Z_FOOTER_OPTIONS).default(FOOTER_OPTION_VALUES)
  }).default({}),
  breaking_change: import_zod2.z.object({
    add_exclamation_to_title: import_zod2.z.boolean().default(true)
  }).default({}),
  confirm_commit: import_zod2.z.boolean().default(true)
}).default({});
var CommitState = import_zod2.z.object({
  type: import_zod2.z.string().default(""),
  scope: import_zod2.z.string().default(""),
  title: import_zod2.z.string().default(""),
  body: import_zod2.z.string().default(""),
  closes: import_zod2.z.string().default(""),
  ticket: import_zod2.z.string().default(""),
  breaking_title: import_zod2.z.string().default(""),
  breaking_body: import_zod2.z.string().default(""),
  deprecates: import_zod2.z.string().default(""),
  deprecates_title: import_zod2.z.string().default(""),
  deprecates_body: import_zod2.z.string().default("")
}).default({});

// src/index.ts
main(load_setup());
function load_setup() {
  console.clear();
  p.intro(`${import_picocolors2.default.bgCyan(import_picocolors2.default.black(" better-commits "))}`);
  const root = (0, import_child_process.execSync)("git rev-parse --show-toplevel").toString().trim();
  const root_path = `${root}/${CONFIG_FILE_NAME}`;
  if (import_fs.default.existsSync(root_path)) {
    p.log.step("Found repository config");
    return read_config_from_path(root_path);
  }
  const home_path = get_default_config_path();
  if (import_fs.default.existsSync(home_path)) {
    p.log.step("Found global config");
    return read_config_from_path(home_path);
  }
  const default_config = Config.parse({});
  p.log.step("Config not found. Generating default .better-commit.json at $HOME");
  import_fs.default.writeFileSync(home_path, JSON.stringify(default_config, null, "	"));
  return default_config;
}
function read_config_from_path(config_path) {
  let res = null;
  try {
    res = JSON.parse(import_fs.default.readFileSync(config_path, "utf8"));
  } catch (err) {
    p.log.error("Invalid JSON file. Exiting.\n" + err);
    process.exit(0);
  }
  return validate_config(res);
}
function validate_config(config) {
  try {
    return Config.parse(config);
  } catch (err) {
    console.log((0, import_zod_validation_error.fromZodError)(err).message);
    process.exit(0);
  }
}
async function main(config) {
  let commit_state = CommitState.parse({});
  let git_status = await (0, import_simple_git.simpleGit)().status();
  if (config.check_status) {
    p.log.step(import_picocolors2.default.black(import_picocolors2.default.bgGreen(" Checking Git Status ")));
    const missing_files = check_missing_stage(git_status);
    const staged_files = git_status.staged.reduce((acc, curr, i) => import_picocolors2.default.green(acc + curr + addNewLine(git_status.staged, i)), "");
    p.log.success("Changes to be committed:\n" + staged_files);
    if (missing_files.length) {
      const unstaged_files = missing_files.reduce((acc, curr, i) => import_picocolors2.default.red(acc + curr + addNewLine(missing_files, i)), "");
      p.log.error("Changes not staged for commit:\n" + unstaged_files);
      const selected_for_staging = await p.multiselect({
        message: `Some files have not been staged, would you like to add them now? ${SPACE_TO_SELECT}`,
        options: [{ value: ".", label: "." }, ...missing_files.map((v) => ({ value: v, label: v }))],
        required: false
      });
      if (p.isCancel(selected_for_staging))
        process.exit(0);
      await (0, import_simple_git.simpleGit)().add(selected_for_staging);
      git_status = await (0, import_simple_git.simpleGit)().status();
      if (selected_for_staging?.length) {
        p.log.success(import_picocolors2.default.green("Changes successfully staged"));
      }
    }
  }
  if (!git_status.staged.length) {
    p.log.error(import_picocolors2.default.red('no changes added to commit (use "git add" and/or "git commit -a")'));
    process.exit(0);
  }
  if (config.commit_type.enable) {
    const commit_type = await p.select(
      {
        message: `Select a commit type`,
        initialValue: config.commit_type.initial_value,
        options: config.commit_type.options
      }
    );
    if (p.isCancel(commit_type))
      process.exit(0);
    commit_state.type = commit_type;
  }
  if (config.commit_scope.enable) {
    const commit_scope = await p.select({
      message: "Select a commit scope",
      initialValue: config.commit_scope.initial_value,
      options: config.commit_scope.options
    });
    if (p.isCancel(commit_scope))
      process.exit(0);
    commit_state.scope = commit_scope;
  }
  if (config.check_ticket.infer_ticket) {
    const branch = (0, import_child_process.execSync)("git rev-parse --abbrev-ref HEAD").toString();
    const found = [branch.match(REGEX_SLASH_TAG), branch.match(REGEX_SLASH_NUM), branch.match(REGEX_START_TAG), branch.match(REGEX_START_NUM)].filter((v) => v != null).map((v) => v && v.length >= 2 ? v[1] : "");
    commit_state.ticket = found.length ? found[0] : "";
  }
  if (config.check_ticket.confirm_ticket) {
    console.log("value:", commit_state.ticket);
    const user_commit_ticket = await p.text({
      message: commit_state.ticket ? "Ticket / issue infered from branch (confirm / edit)" : `Add ticket / issue ${OPTIONAL_PROMPT}`,
      initialValue: commit_state.ticket
    });
    if (p.isCancel(user_commit_ticket))
      process.exit(0);
    commit_state.ticket = user_commit_ticket ?? "";
  }
  const commit_title = await p.text(
    {
      message: "Write a brief title describing the commit",
      placeholder: "",
      validate: (value) => {
        if (!value)
          return "Please enter a title";
        const commit_scope_size = commit_state.scope ? commit_state.scope.length + 2 : 0;
        const commit_type_size = commit_state.type.length;
        const commit_ticket_size = config.check_ticket.add_to_title ? commit_state.ticket.length : 0;
        if (commit_scope_size + commit_type_size + commit_ticket_size + value.length > config.commit_title.max_size)
          return `Exceeded max length. Title max [${config.commit_title.max_size}]`;
      }
    }
  );
  if (p.isCancel(commit_title))
    process.exit(0);
  commit_state.title = clean_commit_title(commit_title);
  if (config.commit_body.enable) {
    const commit_body = await p.text({
      message: `Write a detailed description of the changes ${OPTIONAL_PROMPT}`,
      placeholder: "",
      validate: (val) => {
        if (config.commit_body.required && !val)
          return "Please enter a description";
      }
    });
    if (p.isCancel(commit_body))
      process.exit(0);
    commit_state.body = commit_body;
  }
  if (config.commit_footer.enable) {
    const commit_footer = await p.multiselect({
      message: `Select optional footers ${SPACE_TO_SELECT}`,
      initialValues: config.commit_footer.initial_value,
      options: COMMIT_FOOTER_OPTIONS,
      required: false
    });
    if (commit_footer?.includes("breaking-change")) {
      const breaking_changes_title = await p.text({
        message: "Breaking changes: Write a short title / summary",
        placeholder: "",
        validate: (value) => {
          if (!value)
            return "Please enter a title / summary";
        }
      });
      const breaking_changes_body = await p.text({
        message: `Breaking Changes: Write a description & migration instructions ${OPTIONAL_PROMPT}`,
        placeholder: ""
      });
      commit_state.breaking_title = breaking_changes_title;
      commit_state.breaking_body = breaking_changes_body;
    }
    if (commit_footer?.includes("deprecated")) {
      const deprecated_title = await p.text({
        message: "Deprecated: Write a short title / summary",
        placeholder: "",
        validate: (value) => {
          if (!value)
            return "Please enter a title / summary";
        }
      });
      const deprecated_body = await p.text({
        message: `Deprecated: Write a description ${OPTIONAL_PROMPT}`,
        placeholder: ""
      });
      commit_state.deprecates_body = deprecated_body;
      commit_state.deprecates_title = deprecated_title;
    }
    if (commit_footer?.includes("closes")) {
      commit_state.closes = "Closes:";
    }
  }
  let continue_commit = true;
  p.note(build_commit_string(commit_state, config, true), "Commit Preview");
  if (config.confirm_commit) {
    continue_commit = await p.confirm({ message: "Confirm Commit?" });
    if (p.isCancel(continue_commit))
      process.exit(0);
  }
  if (continue_commit)
    (0, import_simple_git.simpleGit)().commit(build_commit_string(commit_state, config, false));
}
function build_commit_string(commit_state, config, colorize = false) {
  let commit_string = "";
  if (commit_state.type) {
    commit_string += colorize ? import_picocolors2.default.blue(commit_state.type) : commit_state.type;
  }
  if (commit_state.scope) {
    const scope = colorize ? import_picocolors2.default.cyan(commit_state.scope) : commit_state.scope;
    commit_string += `(${scope})`;
  }
  if (commit_state.breaking_title && config.breaking_change.add_exclamation_to_title) {
    commit_string += colorize ? import_picocolors2.default.red("!") : "!";
  }
  if (commit_state.scope || commit_state.type) {
    commit_string += ": ";
  }
  if (commit_state.ticket) {
    commit_string += colorize ? import_picocolors2.default.magenta(commit_state.ticket) + " " : commit_state.ticket + " ";
  }
  if (commit_state.title) {
    commit_string += colorize ? import_picocolors2.default.reset(commit_state.title) : commit_state.title;
  }
  if (commit_state.body) {
    const temp = commit_state.body.split("\\n");
    const res = temp.map((v) => colorize ? import_picocolors2.default.reset(v.trim()) : v.trim()).join("\n");
    commit_string += colorize ? `

${res}` : `

${res}`;
  }
  if (commit_state.breaking_title) {
    const title = colorize ? import_picocolors2.default.red(`BREAKING CHANGE: ${commit_state.breaking_title}`) : `BREAKING CHANGE: ${commit_state.breaking_title}`;
    commit_string += `

${title}`;
  }
  if (commit_state.breaking_body) {
    const body = colorize ? import_picocolors2.default.red(commit_state.breaking_body) : commit_state.breaking_body;
    commit_string += `

${body}`;
  }
  if (commit_state.deprecates_title) {
    const title = colorize ? import_picocolors2.default.yellow(`DEPRECATED: ${commit_state.deprecates_title}`) : `DEPRECATED: ${commit_state.deprecates_title}`;
    commit_string += `

${title}`;
  }
  if (commit_state.deprecates_body) {
    const body = colorize ? import_picocolors2.default.yellow(commit_state.deprecates_body) : commit_state.deprecates_body;
    commit_string += `

${body}`;
  }
  if (commit_state.closes && commit_state.ticket) {
    commit_string += colorize ? `

${import_picocolors2.default.reset(commit_state.closes)} ${import_picocolors2.default.magenta(commit_state.ticket)}` : `

${commit_state.closes} ${commit_state.ticket}`;
  }
  return commit_string;
}
