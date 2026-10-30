import type { Readable, Writable } from "node:stream";
import { styleText } from "node:util";
import { TextPrompt } from "@clack/core";
import { S_BAR, S_BAR_END, settings, symbol } from "@clack/prompts";
import { format_commit_title_remaining } from "../utils/commit-title-size";

type TextWithRemainingOptions = {
  message: string;
  placeholder?: string;
  defaultValue?: string;
  initialValue?: string;
  validate?: (value: string | undefined) => string | Error | undefined;
  /** Remaining characters for the current input (may be negative when over). */
  getRemaining: (value: string) => number;
  formatRemaining?: (remaining: number) => string;
  input?: Readable;
  output?: Writable;
  signal?: AbortSignal;
  withGuide?: boolean;
};

/**
 * Stock clack `text()` with a live remaining-character subtext that updates
 * as the user types. Rendered on the guide end line (hint/subtext).
 */
class TextWithRemainingPrompt extends TextPrompt {
  constructor(private readonly promptOptions: TextWithRemainingOptions) {
    super({
      validate: promptOptions.validate,
      placeholder: promptOptions.placeholder,
      defaultValue: promptOptions.defaultValue,
      initialValue: promptOptions.initialValue,
      output: promptOptions.output,
      signal: promptOptions.signal,
      input: promptOptions.input,
      render() {
        const hasGuide = promptOptions.withGuide ?? settings.withGuide;
        const title = `${hasGuide ? `${styleText("gray", S_BAR)}\n` : ""}${symbol(this.state)}  ${promptOptions.message}\n`;
        const placeholder = promptOptions.placeholder
          ? styleText("inverse", promptOptions.placeholder[0]) +
            styleText("dim", promptOptions.placeholder.slice(1))
          : styleText(["inverse", "hidden"], "_");
        const userInput = this.userInput
          ? this.userInputWithCursor
          : placeholder;
        const value = this.value ?? "";
        const format =
          promptOptions.formatRemaining ?? format_commit_title_remaining;
        const remainingLabel = styleText(
          "dim",
          format(promptOptions.getRemaining(this.userInput)),
        );

        switch (this.state) {
          case "error": {
            const error = this.error
              ? `  ${styleText("yellow", this.error)}`
              : "";
            const bar = hasGuide ? `${styleText("yellow", S_BAR)}  ` : "";
            const end = hasGuide ? styleText("yellow", S_BAR_END) : "";
            return `${title.trim()}\n${bar}${userInput}\n${end}${error}\n`;
          }
          case "submit": {
            const result = value ? `  ${styleText("dim", value)}` : "";
            const bar = hasGuide ? styleText("gray", S_BAR) : "";
            return `${title}${bar}${result}`;
          }
          case "cancel": {
            const result = value
              ? `  ${styleText(["strikethrough", "dim"], value)}`
              : "";
            const bar = hasGuide ? styleText("gray", S_BAR) : "";
            return `${title}${bar}${result}${value.trim() ? `\n${bar}` : ""}`;
          }
          default: {
            const bar = hasGuide ? `${styleText("cyan", S_BAR)}  ` : "";
            const end = hasGuide ? styleText("cyan", S_BAR_END) : "";
            return `${title}${bar}${userInput}\n${end}  ${remainingLabel}\n`;
          }
        }
      },
    });
  }
}

export function textWithRemaining(
  opts: TextWithRemainingOptions,
): Promise<string | symbol> {
  return new TextWithRemainingPrompt(opts).prompt() as Promise<
    string | symbol
  >;
}
