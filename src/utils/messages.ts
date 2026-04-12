import color from "picocolors";

export function cache_message(message: string): string {
  return `${message} ${color.dim("· restored from cache")}`;
}

export function inferred_message(message: string): string {
  return `${message} ${color.dim("· inferred from branch")}`;
}

export function optional_message(message: string): string {
  return `${message} ${color.dim("· optional")}`;
}

export function space_to_select_message(message: string): string {
  return `${message} ${color.dim("· <space> to select")}`;
}

export function a_for_all_message(message: string): string {
  return `${message} ${color.dim("· <space> to select | <a> to select all")}`;
}
