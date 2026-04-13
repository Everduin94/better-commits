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
