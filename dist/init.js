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

// src/zod-state.ts
var import_zod2 = require("zod");

// src/utils.ts
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
var Z_FOOTER_OPTIONS = import_zod.z.enum(["closes", "breaking-change", "deprecated"]);
var FOOTER_OPTION_VALUES = ["closes", "breaking-change", "deprecated"];

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

// src/init.ts
var import_picocolors2 = __toESM(require("picocolors"));
var import_fs = __toESM(require("fs"));
var import_child_process = require("child_process");
var p = __toESM(require("@clack/prompts"));
try {
  console.clear();
  p.intro(`${import_picocolors2.default.cyan("better-commits-init")}`);
  const root = (0, import_child_process.execSync)("git rev-parse --show-toplevel").toString().trim();
  const root_path = `${root}/${CONFIG_FILE_NAME}`;
  const default_config = Config.parse({});
  import_fs.default.writeFileSync(root_path, JSON.stringify(default_config, null, "	"));
  p.log.success(`${import_picocolors2.default.green("Successfully created .better-commits.json")}`);
  p.outro(`Run ${import_picocolors2.default.bgBlack(import_picocolors2.default.white("better-commits"))} to start the CLI`);
} catch (err) {
  p.log.error(`${import_picocolors2.default.red("Could not determine git root folder. better-commits-init must be used in a git repository")}`);
}
