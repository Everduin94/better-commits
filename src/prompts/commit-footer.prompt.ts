import * as p from "@clack/prompts";
import { Output } from "valibot";
import { V_FOOTER_OPTIONS } from "../valibot-consts";
import {
  COMMIT_FOOTER_OPTIONS,
  get_value_from_cache,
  set_value_cache,
} from "../utils";
import {
  cache_message,
  optional_message,
  space_to_select_message,
} from "../utils/messages";
import { Runnable } from "./runnable";

type FooterOption = Output<typeof V_FOOTER_OPTIONS>;
type FooterPromptOption = {
  value: FooterOption;
  label: string;
  hint: string;
};

type FooterSelection = {
  includes_breaking_change: boolean;
  includes_deprecated: boolean;
  includes_closes: boolean;
  includes_custom: boolean;
  includes_trailer: boolean;
};

type FooterInputs = {
  breaking_title: string;
  breaking_body: string;
  deprecated_title: string;
  deprecated_body: string;
  custom_footer: string;
};

export class CommitFooterPrompt extends Runnable {
  async run(): Promise<void> {
    if (!this.#is_enabled) return;

    const { initial_values, message } = this.#get_initial_value();
    const commit_footer = (await p.multiselect({
      message,
      initialValues: initial_values,
      options: this.#options,
      required: false,
    })) as FooterOption[];
    if (p.isCancel(commit_footer)) process.exit(0);

    const selection = this.#get_selection(commit_footer);
    const footer_inputs = await this.#get_footer_inputs(selection);
    this.#run_post_effects(commit_footer, selection, footer_inputs);
  }

  get #is_enabled(): boolean {
    return this.config.commit_footer.enable;
  }

  get #options(): FooterPromptOption[] {
    const allowed_values = new Set(this.config.commit_footer.options);
    return COMMIT_FOOTER_OPTIONS.filter((option) =>
      allowed_values.has(option.value as FooterOption),
    ) as FooterPromptOption[];
  }

  get #available_option_values(): FooterOption[] {
    return this.#options.map((option) => option.value);
  }

  #get_initial_value(): { initial_values: FooterOption[]; message: string } {
    const cache_value = get_value_from_cache(
      this.prompt_cache,
      "commit_footer",
    );
    if (cache_value) {
      return {
        initial_values: this.#parse_cache_value(cache_value),
        message: space_to_select_message(cache_message("Commit footers")),
      };
    }

    const initial_values = this.config.commit_footer.initial_value.filter(
      (value) => this.#available_option_values.includes(value),
    );
    return {
      initial_values,
      message: space_to_select_message(
        optional_message("Select optional footers"),
      ),
    };
  }

  #parse_cache_value(cache_value: string): FooterOption[] {
    return cache_value
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is FooterOption =>
        this.#available_option_values.includes(value as FooterOption),
      );
  }

  #get_selection(commit_footer: FooterOption[]): FooterSelection {
    return {
      includes_breaking_change: commit_footer.includes("breaking-change"),
      includes_deprecated: commit_footer.includes("deprecated"),
      includes_closes: commit_footer.includes("closes"),
      includes_custom: commit_footer.includes("custom"),
      includes_trailer: commit_footer.includes("trailer"),
    };
  }

  async #get_footer_inputs(selection: FooterSelection): Promise<FooterInputs> {
    const footer_inputs: FooterInputs = {
      breaking_title: "",
      breaking_body: "",
      deprecated_title: "",
      deprecated_body: "",
      custom_footer: "",
    };

    if (selection.includes_breaking_change) {
      footer_inputs.breaking_title = await this.#required_text(
        "Breaking changes: Write a short title / summary",
      );
      footer_inputs.breaking_body = await this.#optional_text(
        optional_message(
          "Breaking Changes: Write a description & migration instructions",
        ),
      );
    }

    if (selection.includes_deprecated) {
      footer_inputs.deprecated_title = await this.#required_text(
        "Deprecated: Write a short title / summary",
      );
      footer_inputs.deprecated_body = await this.#optional_text(
        optional_message("Deprecated: Write a description"),
      );
    }

    if (selection.includes_custom) {
      footer_inputs.custom_footer = await this.#optional_text(
        "Write a custom footer",
      );
    }

    return footer_inputs;
  }

  async #required_text(message: string): Promise<string> {
    const response = await p.text({
      message,
      placeholder: "",
      validate: (value) => {
        if (!value) return "Please enter a title / summary";
      },
    });
    if (p.isCancel(response)) process.exit(0);
    return response ?? "";
  }

  async #optional_text(message: string): Promise<string> {
    const response = await p.text({
      message,
      placeholder: "",
    });
    if (p.isCancel(response)) process.exit(0);
    return response ?? "";
  }

  #run_post_effects(
    commit_footer: FooterOption[],
    selection: FooterSelection,
    footer_inputs: FooterInputs,
  ): void {
    set_value_cache(
      this.prompt_cache,
      "commit_footer",
      commit_footer.join(","),
    );

    this.commit_state.breaking_title = footer_inputs.breaking_title;
    this.commit_state.breaking_body = footer_inputs.breaking_body;
    this.commit_state.deprecates_title = footer_inputs.deprecated_title;
    this.commit_state.deprecates_body = footer_inputs.deprecated_body;
    this.commit_state.custom_footer = footer_inputs.custom_footer;

    this.commit_state.closes = selection.includes_closes ? "Closes:" : "";
    if (!selection.includes_trailer) {
      this.commit_state.trailer = "";
    }
  }
}
