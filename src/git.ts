#! /usr/bin/env node
import { execSync } from "child_process";
import * as p from "@clack/prompts";
import color from "picocolors";
import { flags } from "./args";

const porcelain_states = ["M", "T", "R", "D", "A", "C"];

export function git_status(): { index: string[]; work_tree: string[] } {
  let status = "";
  try {
    status = execSync(`git ${flags.git_args} status --porcelain`, {
      stdio: "pipe",
    }).toString();
  } catch (err) {
    p.log.error(color.red("Failed to git status" + err));
    return { index: [], work_tree: [] };
  }

  const lines = status.split("\n");
  const work_tree: string[] = [];
  const index: string[] = [];
  lines.forEach((v) => {
    const line = v.trimEnd();
    if (!line) return;

    const path_plus_file = line.substring(2).trim();
    const first_char = line.charAt(0).trim();
    const second_char = line.charAt(1).trim();

    // Untracked, always dirty
    if (first_char === "?" || second_char === "?") {
      work_tree.push(path_plus_file);
    }

    if (porcelain_states.includes(first_char)) {
      index.push(path_plus_file);
    }

    if (porcelain_states.includes(second_char)) {
      work_tree.push(path_plus_file);
    }
  });

  return { index, work_tree };
}

export function git_add(files: string[]) {
  const space_delimited_files = files.join(" ");
  if (space_delimited_files) {
    try {
      execSync(`git ${flags.git_args} add ${space_delimited_files}`, {
        stdio: "pipe",
      }).toString();
      p.log.success(color.green("Changes successfully staged"));
    } catch (err) {
      p.log.error(color.red("Failed to stage changes"));
    }
  }
}
