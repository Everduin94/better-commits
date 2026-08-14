import fs from "fs";
import { homedir } from "os";
import path from "path";

export interface PromptCache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  clear(): void;
}

export class FilePromptCache implements PromptCache {
  readonly path = path.join(
    process.env.XDG_CONFIG_HOME ?? path.join(homedir(), ".config"),
    "configstore",
    "better-commits.json",
  );

  get(key: string): string | undefined {
    return this.read()[key];
  }

  set(key: string, value: string): void {
    this.write({ ...this.read(), [key]: value });
  }

  clear(): void {
    this.write({});
  }

  private read(): Record<string, string> {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.path, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        this.write({});
        return {};
      }
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
      if (error instanceof SyntaxError) {
        this.write({});
        return {};
      }
      throw error;
    }
  }

  private write(cache: Record<string, string>): void {
    fs.mkdirSync(path.dirname(this.path), { mode: 0o700, recursive: true });
    fs.writeFileSync(this.path, JSON.stringify(cache, null, "\t"), {
      mode: 0o600,
    });
  }
}
