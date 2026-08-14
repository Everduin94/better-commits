import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG_TEMPLATE } from "../default-config-template";
import { stripJsonComments } from "./strip-json-comments";

describe("stripJsonComments", () => {
  it("removes single line comments", () => {
    expect(stripJsonComments('{\n\t// comment\n\t"a":"b"\n}')).toBe(
      '{\n\t          \n\t"a":"b"\n}',
    );
  });

  it("removes single line comments at the end of a line", () => {
    expect(stripJsonComments('{\n\t"a":"b" // comment\n}')).toBe(
      '{\n\t"a":"b"           \n}',
    );
  });

  it("removes multiline comments", () => {
    expect(stripJsonComments('{\n\t/*\n\tcomment\n\t*/\n\t"a":"b"\n}')).toBe(
      '{\n\t  \n\t       \n\t  \n\t"a":"b"\n}',
    );
  });

  it("removes multiline comments at the end of a line", () => {
    expect(stripJsonComments('{\n\t"a":"b" /* comment */\n}')).toBe(
      '{\n\t"a":"b"              \n}',
    );
  });

  it("removes comments preceded by whitespace", () => {
    expect(stripJsonComments('{\n\t"a":"b"    /* comment */\n}')).toBe(
      '{\n\t"a":"b"                 \n}',
    );
  });

  it("removes multiple single line comments", () => {
    expect(
      stripJsonComments('/*comment*/\n{\n\t/*comment*/ "a":"b" //comment\n}'),
    ).toBe('           \n{\n\t            "a":"b"          \n}');
  });

  it("removes multiple multiline comments", () => {
    expect(
      stripJsonComments(
        '/*\ncomment\ncomment*/\n{\n\t/*\n\tcomment\n\t*/\n\t"a":"b"\n}',
      ),
    ).toBe(
      '  \n       \n         \n{\n\t  \n\t       \n\t  \n\t"a":"b"\n}',
    );
  });

  it("removes comments with line breaks", () => {
    expect(stripJsonComments('{"a":"b"/**/}')).toBe('{"a":"b"    }');
  });

  it("removes comments with multiple asterisks", () => {
    expect(stripJsonComments('{"a":"b"/**\n\n**/}')).toBe(
      '{"a":"b"   \n\n   }',
    );
  });

  it("does not strip comment markers within strings", () => {
    expect(stripJsonComments('{"a":"b // comment"}')).toBe(
      '{"a":"b // comment"}',
    );
    expect(stripJsonComments('{"a":"b /* comment */"}')).toBe(
      '{"a":"b /* comment */"}',
    );
    expect(stripJsonComments('{"/*a":"b"}')).toBe('{"/*a":"b"}');
    expect(stripJsonComments('{"\\"/*a":"b"}')).toBe('{"\\"/*a":"b"}');
  });

  it("handles escaped slashes at end of a string preceding a comment", () => {
    expect(stripJsonComments('{"a":"b\\\\"/* comment */}')).toBe(
      '{"a":"b\\\\"             }',
    );
  });

  it("handles weird escaping", () => {
    expect(stripJsonComments('{"a":"\\\\\\\\"/* comment */}')).toBe(
      '{"a":"\\\\\\\\"             }',
    );
  });

  it("handles new lines inside strings", () => {
    expect(stripJsonComments('{"a":"\\\nfoo"}')).toBe('{"a":"\\\nfoo"}');
  });

  it("handles CRLF line endings", () => {
    expect(stripJsonComments('{\r\n\t// comment\r\n\t"a":"b"\r\n}')).toBe(
      '{\r\n\t          \r\n\t"a":"b"\r\n}',
    );
  });

  it("handles a lone carriage return terminating a line comment", () => {
    expect(stripJsonComments('{\r\t// comment\r\t"a":"b"\r}')).toBe(
      '{\r\t          \r\t"a":"b"\r}',
    );
  });

  it("handles line comments that run to end of file with no trailing newline", () => {
    expect(stripJsonComments('{"a":"b"}\n// comment')).toBe(
      '{"a":"b"}\n          ',
    );
  });

  it("removes trailing commas from arrays and objects with trailingCommas option", () => {
    expect(
      stripJsonComments('{"a":"b","c":"d",}', { trailingCommas: true }),
    ).toBe('{"a":"b","c":"d" }');
    expect(
      stripJsonComments('{"arr":[1,2,3,]}', { trailingCommas: true }),
    ).toBe('{"arr":[1,2,3 ]}');
  });

  it("removes trailing commas mixed with comments when trailingCommas is true", () => {
    expect(
      stripJsonComments('{"a":"b", // comment\n}', { trailingCommas: true }),
    ).toBe('{"a":"b"            \n}');
  });

  it("does not remove trailing commas by default", () => {
    const jsonWithTrailingComma = '{"a":"b",}';
    expect(stripJsonComments(jsonWithTrailingComma)).toBe(
      jsonWithTrailingComma,
    );
  });

  it("throws / does not crash on malformed block comments and JSON.parse still rejects malformed input", () => {
    const malformed = '{/* unterminated block comment\n"a":"b"}';
    const stripped = stripJsonComments(malformed);
    expect(() => JSON.parse(stripped)).toThrow();
  });

  it("supports the whitespace option (default true) preserving offsets", () => {
    const input = '{\n\t// comment\n\t"a":"b"\n}';
    expect(stripJsonComments(input, { whitespace: true })).toBe(
      '{\n\t          \n\t"a":"b"\n}',
    );
  });

  it("supports whitespace: false to remove comments without preserving offsets", () => {
    expect(stripJsonComments('{\n\t// comment\n\t"a":"b"\n}', { whitespace: false })).toBe(
      '{\n\t\n\t"a":"b"\n}',
    );
  });

  it("does not strip non-breaking space, only regular whitespace/comments", () => {
    const nbsp = "\u00A0";
    const input = `{"a":"b"${nbsp}}`;
    expect(stripJsonComments(input)).toBe(input);
  });

  it("rejects malformed JSON even after stripping with trailingCommas enabled", () => {
    const malformed = '{"a":"b",,}';
    const stripped = stripJsonComments(malformed, { trailingCommas: true });
    expect(() => JSON.parse(stripped)).toThrow();
  });

  it("parses the project's DEFAULT_CONFIG_TEMPLATE after stripping comments and trailing commas", () => {
    const stripped = stripJsonComments(DEFAULT_CONFIG_TEMPLATE, {
      trailingCommas: true,
    });
    expect(() => JSON.parse(stripped)).not.toThrow();
  });
});
