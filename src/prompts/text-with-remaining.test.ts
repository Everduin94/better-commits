import { PassThrough } from "node:stream";
import { Prompt } from "@clack/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { textWithRemaining } from "./text-with-remaining";

type InternalPrompt = {
  state: string;
  userInput: string;
  value: string;
  error: string;
  _setUserInput: (value: string | undefined, write?: boolean) => void;
  _render: (this: InternalPrompt) => string | undefined;
};

function createOutput(): PassThrough {
  const output = new PassThrough();
  Object.assign(output, { columns: 80, rows: 24, isTTY: true });
  return output;
}

async function createPrompt(
  getRemaining: (value: string) => number = (value) => 10 - value.length,
): Promise<InternalPrompt> {
  vi.spyOn(Prompt.prototype, "prompt").mockImplementation(function () {
    return Promise.resolve(this as never);
  });

  return (await textWithRemaining({
    message: "Write a title",
    getRemaining,
    output: createOutput(),
    withGuide: true,
  })) as unknown as InternalPrompt;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("textWithRemaining", () => {
  it("shows live remaining count while active", async () => {
    const prompt = await createPrompt((value) => 5 - value.length);
    prompt.state = "active";
    prompt._setUserInput("hi");

    const rendered = prompt._render.call(prompt) ?? "";
    expect(rendered).toContain("3 characters remaining");
    expect(rendered).toContain("Write a title");
  });

  it("shows over-limit copy when remaining is negative", async () => {
    const prompt = await createPrompt((value) => 2 - value.length);
    prompt.state = "active";
    prompt._setUserInput("toolong");

    const rendered = prompt._render.call(prompt) ?? "";
    expect(rendered).toContain("5 characters over limit");
  });
});
