type CommitTitleSizeInput = {
  type?: string;
  scope?: string;
  ticket?: string;
  title?: string;
};

type CommitTitleSizeOptions = {
  include_ticket: boolean;
};

export function get_commit_title_size(
  val: CommitTitleSizeInput,
  options: CommitTitleSizeOptions,
): number {
  const commit_scope_size = val.scope ? val.scope.length + 2 : 0;
  const commit_type_size = val.type?.length ?? 0;
  const commit_ticket_size = options.include_ticket
    ? (val.ticket?.length ?? 0)
    : 0;
  const title_size = val.title?.length ?? 0;

  return commit_scope_size + commit_type_size + commit_ticket_size + title_size;
}

export function get_commit_title_remaining(
  val: CommitTitleSizeInput,
  options: CommitTitleSizeOptions & { max_size: number },
): number {
  return options.max_size - get_commit_title_size(val, options);
}

export function format_commit_title_remaining(remaining: number): string {
  if (remaining >= 0) {
    return `${remaining} character${remaining === 1 ? "" : "s"} remaining`;
  }

  const over = Math.abs(remaining);
  return `${over} character${over === 1 ? "" : "s"} over limit`;
}
