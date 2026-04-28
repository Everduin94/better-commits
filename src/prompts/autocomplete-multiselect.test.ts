import type { Key } from "node:readline";
import { PassThrough } from "node:stream";
import { Prompt } from "@clack/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { autocompleteMultiselect } from "./autocomplete-multiselect";

type InternalPrompt<Value> = {
  _isActionKey: (char: string | undefined, key: Key) => boolean;
  _setUserInput: (value: string | undefined, write?: boolean) => void;
  onKeypress: (char: string | undefined, key: Key) => void;
  selectedValues: Value[];
  focusedValue: Value | undefined;
  userInput: string;
  state: string;
  rl?: FakeReadLine;
};

type FakeReadLine = {
  line: string;
  cursor: number;
  write: ReturnType<typeof vi.fn>;
};

function createOutput(): PassThrough {
  const output = new PassThrough();
  Object.assign(output, { columns: 80, rows: 24, isTTY: true });
  return output;
}

function createReadLine(line: string): FakeReadLine {
  const rl: FakeReadLine = {
    line,
    cursor: line.length,
    write: vi.fn((_: string | null, key?: Key) => {
      if (key?.ctrl && key.name === "h") {
        rl.line = rl.line.slice(0, -1);
        rl.cursor = Math.max(0, rl.cursor - 1);
      }

      if (key?.ctrl && key.name === "e") {
        rl.cursor = rl.line.length;
      }
    }),
  };

  return rl;
}

async function createPrompt(): Promise<InternalPrompt<string>> {
  vi.spyOn(Prompt.prototype, "prompt").mockImplementation(function () {
    return Promise.resolve(this as never);
  });

  return (await autocompleteMultiselect({
    message: "Pick files",
    options: [
      { value: "src/foo.ts", label: "src/foo.ts" },
      { value: "test/foo.ts", label: "test/foo.ts" },
    ],
    output: createOutput(),
    withGuide: false,
  })) as unknown as InternalPrompt<string>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("autocompleteMultiselect", () => {
  it("uses space to toggle the focused option while searching", async () => {
    const prompt = await createPrompt();
    prompt.state = "active";
    prompt._setUserInput("src");
    prompt.rl = createReadLine("src ");

    expect(prompt._isActionKey(" ", { name: "space", sequence: " " } as Key)).toBe(true);

    prompt.onKeypress(" ", { name: "space", sequence: " " } as Key);

    expect(prompt.selectedValues).toEqual(["src/foo.ts"]);
    expect(prompt.userInput).toBe("src");
    expect(prompt.rl.line).toBe("src");
    expect(prompt.rl.write).toHaveBeenNthCalledWith(1, null, {
      ctrl: true,
      name: "h",
    });
    expect(prompt.rl.write).toHaveBeenNthCalledWith(2, "", {
      ctrl: true,
      name: "e",
    });
  });

  it("keeps tab selection behavior unchanged", async () => {
    const prompt = await createPrompt();
    prompt.state = "active";
    prompt._setUserInput("src");
    prompt.rl = createReadLine("src\t");

    prompt.onKeypress("\t", { name: "tab", sequence: "\t" } as Key);

    expect(prompt.selectedValues).toEqual(["src/foo.ts"]);
    expect(prompt.userInput).toBe("src");
    expect(prompt.rl.line).toBe("src");
    expect(prompt.rl.write).toHaveBeenCalledTimes(1);
    expect(prompt.rl.write).toHaveBeenCalledWith(null, {
      ctrl: true,
      name: "h",
    });
  });

  it("does not add whitespace to the filter when nothing matches", async () => {
    const prompt = await createPrompt();
    prompt.state = "active";
    prompt._setUserInput("missing");
    prompt.rl = createReadLine("missing ");

    prompt.onKeypress(" ", { name: "space", sequence: " " } as Key);

    expect(prompt.focusedValue).toBeUndefined();
    expect(prompt.selectedValues).toEqual([]);
    expect(prompt.userInput).toBe("missing");
    expect(prompt.rl.line).toBe("missing");
    expect(prompt.rl.write).toHaveBeenCalledTimes(1);
    expect(prompt.rl.write).toHaveBeenCalledWith(null, {
      ctrl: true,
      name: "h",
    });
  });
});
