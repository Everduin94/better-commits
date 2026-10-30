export type CoAuthor = {
  name: string;
  email: string;
};

export function format_co_authored_by(name: string, email: string): string {
  return `Co-authored-by: ${name.trim()} <${email.trim()}>`;
}

export function format_co_author_label(author: CoAuthor): string {
  return `${author.name.trim()} <${author.email.trim()}>`;
}

/**
 * Accepts either `Name <email>` or a full `Co-authored-by: Name <email>` trailer.
 * Returns a normalized trailer, or null when the input cannot be parsed.
 */
export function normalize_co_author_input(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const without_prefix = trimmed.replace(/^Co-authored-by:\s*/i, "").trim();
  const match = without_prefix.match(/^(.+?)\s*<([^<>]+)>$/);
  if (!match) return null;

  const name = match[1].trim();
  const email = match[2].trim();
  if (!name || !email) return null;

  return format_co_authored_by(name, email);
}

export function normalize_co_author_inputs(inputs: string[]): string[] {
  const trailers: string[] = [];
  for (const input of inputs) {
    const trailer = normalize_co_author_input(input);
    if (trailer && !trailers.includes(trailer)) {
      trailers.push(trailer);
    }
  }
  return trailers;
}

export function join_co_author_trailers(trailers: string[]): string {
  return trailers.filter(Boolean).join("\n");
}
