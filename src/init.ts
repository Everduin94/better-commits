#! /usr/bin/env node

import * as p from "@clack/prompts";
import fs from "fs";
import color from "picocolors";
import { parse } from "valibot";
import { CONFIG_FILE_NAME, get_git_root } from "./utils";
import { Config } from "./valibot-state";

try {
  console.clear();
  p.intro(`${color.bgCyan(color.black(" better-commits-init "))}`);
  const root = get_git_root();
  const root_path = `${root}/${CONFIG_FILE_NAME}`;
  const default_config = parse(Config, {});
  fs.writeFileSync(root_path, JSON.stringify(default_config, null, 4));
  p.log.success(`${color.green("Successfully created .better-commits.json")}`);
  p.outro(
    `Run ${color.bgBlack(color.white("better-commits"))} to start the CLI`,
  );
} catch (err: any) {
  p.log.error(
    `${color.red("Could not determine git root folder. better-commits-init must be used in a git repository")}`,
  );
}
