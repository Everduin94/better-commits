// Adapted from strip-json-comments v5.0.3 by Sindre Sorhus.
// Licensed under the MIT License

const singleComment = Symbol("singleComment");
const multiComment = Symbol("multiComment");

type Comment = typeof singleComment | typeof multiComment;
type Strip = (value: string, start: number, end?: number) => string;

interface StripJsonCommentsOptions {
  whitespace?: boolean;
  trailingCommas?: boolean;
}

const stripWithoutWhitespace: Strip = () => "";

// Preserve spaces, tabs, and line endings so JSON error positions remain useful.
const stripWithWhitespace: Strip = (value, start, end) =>
  value.slice(start, end).replace(/[^ \t\r\n]/g, " ");

function isEscaped(jsonString: string, quotePosition: number): boolean {
  let index = quotePosition - 1;
  let backslashCount = 0;

  while (jsonString[index] === "\\") {
    index -= 1;
    backslashCount += 1;
  }

  return Boolean(backslashCount % 2);
}

export function stripJsonComments(
  jsonString: string,
  { whitespace = true, trailingCommas = false }: StripJsonCommentsOptions = {},
): string {
  if (typeof jsonString !== "string") {
    throw new TypeError(
      `Expected argument \`jsonString\` to be a \`string\`, got \`${typeof jsonString}\``,
    );
  }

  const strip = whitespace ? stripWithWhitespace : stripWithoutWhitespace;

  let isInsideString = false;
  let isInsideComment: Comment | false = false;
  let offset = 0;
  let buffer = "";
  let result = "";
  let commaIndex = -1;

  for (let index = 0; index < jsonString.length; index++) {
    const currentCharacter = jsonString[index];
    const nextCharacter = jsonString[index + 1];

    if (!isInsideComment && currentCharacter === '"') {
      if (!isEscaped(jsonString, index)) {
        isInsideString = !isInsideString;
      }
    }

    if (isInsideString) continue;

    if (!isInsideComment && currentCharacter + nextCharacter === "//") {
      buffer += jsonString.slice(offset, index);
      offset = index;
      isInsideComment = singleComment;
      index += 1;
    } else if (
      isInsideComment === singleComment &&
      (currentCharacter === "\r" || currentCharacter === "\n")
    ) {
      isInsideComment = false;
      buffer += strip(jsonString, offset, index);
      offset = index;
    } else if (!isInsideComment && currentCharacter + nextCharacter === "/*") {
      buffer += jsonString.slice(offset, index);
      offset = index;
      isInsideComment = multiComment;
      index += 1;
      continue;
    } else if (
      isInsideComment === multiComment &&
      currentCharacter + nextCharacter === "*/"
    ) {
      index += 1;
      isInsideComment = false;
      buffer += strip(jsonString, offset, index + 1);
      offset = index + 1;
      continue;
    } else if (trailingCommas && !isInsideComment) {
      if (commaIndex !== -1) {
        if (currentCharacter === "}" || currentCharacter === "]") {
          buffer += jsonString.slice(offset, index);
          result += strip(buffer, 0, 1) + buffer.slice(1);
          buffer = "";
          offset = index;
          commaIndex = -1;
        } else if (!/[ \t\r\n]/.test(currentCharacter)) {
          buffer += jsonString.slice(offset, index);
          offset = index;
          commaIndex = -1;
        }
      } else if (currentCharacter === ",") {
        result += buffer + jsonString.slice(offset, index);
        buffer = "";
        offset = index;
        commaIndex = index;
      }
    }
  }

  const remaining =
    isInsideComment === singleComment
      ? strip(jsonString, offset)
      : jsonString.slice(offset);

  return result + buffer + remaining;
}
