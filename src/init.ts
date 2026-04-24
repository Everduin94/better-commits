#! /usr/bin/env node

import * as p from "@clack/prompts";
import fs from "fs";
import color from "picocolors";
import { DEFAULT_CONFIG_TEMPLATE } from "./default-config-template";
import {
  CONFIG_FILE_NAME,
  get_git_root,
  get_repository_config_path,
} from "./utils";

await create_init_config();

export async function create_init_config() {
  console.clear();
  p.intro(`${color.bgCyan(color.black(" better-commits-init "))}`);
  const root = get_git_root();
  const existing_config_path = get_repository_config_path(root);
  const root_path = `${root}/${CONFIG_FILE_NAME}`;

  if (existing_config_path) {
    const should_overwrite = (await p.confirm({
      message: `${existing_config_path.split("/").pop()} already exists. Replace with default ${CONFIG_FILE_NAME}?`,
    })) as boolean;

    if (p.isCancel(should_overwrite) || !should_overwrite) {
      p.outro("Cancelled");
      return;
    }
  }

  try {
    fs.writeFileSync(root_path, DEFAULT_CONFIG_TEMPLATE);
  } catch {
    p.log.error(
      `${color.red("Could not determine git root folder. better-commits-init must be used in a git repository")}`,
    );
  }
  p.log.success(
    `${color.green(`Successfully created ${root_path.split("/").pop()}`)}`,
  );
  p.outro(
    `Run ${color.bgBlack(color.white("better-commits"))} to start the CLI`,
  );
}
