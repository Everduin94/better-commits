"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils.ts
var utils_exports = {};
__export(utils_exports, {
  COMMIT_FOOTER_OPTIONS: () => COMMIT_FOOTER_OPTIONS,
  CONFIG_FILE_NAME: () => CONFIG_FILE_NAME,
  DEFAULT_SCOPE_OPTIONS: () => DEFAULT_SCOPE_OPTIONS,
  DEFAULT_TYPE_OPTIONS: () => DEFAULT_TYPE_OPTIONS,
  FOOTER_OPTION_VALUES: () => FOOTER_OPTION_VALUES,
  OPTIONAL_PROMPT: () => OPTIONAL_PROMPT,
  REGEX_SLASH_NUM: () => REGEX_SLASH_NUM,
  REGEX_SLASH_TAG: () => REGEX_SLASH_TAG,
  REGEX_START_NUM: () => REGEX_START_NUM,
  REGEX_START_TAG: () => REGEX_START_TAG,
  SPACE_TO_SELECT: () => SPACE_TO_SELECT,
  Z_FOOTER_OPTIONS: () => Z_FOOTER_OPTIONS,
  addNewLine: () => addNewLine,
  check_missing_stage: () => check_missing_stage,
  clean_commit_title: () => clean_commit_title,
  get_default_config_path: () => get_default_config_path
});
module.exports = __toCommonJS(utils_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  COMMIT_FOOTER_OPTIONS,
  CONFIG_FILE_NAME,
  DEFAULT_SCOPE_OPTIONS,
  DEFAULT_TYPE_OPTIONS,
  FOOTER_OPTION_VALUES,
  OPTIONAL_PROMPT,
  REGEX_SLASH_NUM,
  REGEX_SLASH_TAG,
  REGEX_START_NUM,
  REGEX_START_TAG,
  SPACE_TO_SELECT,
  Z_FOOTER_OPTIONS,
  addNewLine,
  check_missing_stage,
  clean_commit_title,
  get_default_config_path
});
