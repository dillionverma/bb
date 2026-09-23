import type { ReasoningLevel } from "@bb/domain";
import type { PickerOption } from "./OptionPicker";

const explanations: Record<ReasoningLevel, string> = {
  none: "No extra reasoning. For work that needs a quick response.",
  low: "Less reasoning for straightforward work. Usually faster and uses less allowance.",
  medium: "Moderate reasoning for everyday work.",
  high: "More reasoning for difficult work. Can take longer and use more allowance.",
  xhigh: "Deeper reasoning for demanding work. Expect more time and usage.",
  max: "Maximum reasoning effort. Best reserved for work that needs it.",
  ultracode:
    "Extra high reasoning with automatic multi-agent workflow orchestration.",
  ultra: "Maximum reasoning with automatic task delegation.",
};

export function isExecutionMode(value: ReasoningLevel) {
  return value === "ultracode" || value === "ultra";
}

export function effortDescription(option: PickerOption<ReasoningLevel>) {
  const description = option.description?.trim();
  return description &&
    !/^(low|medium|high|extra high|maximum|none)( reasoning effort)?$/i.test(
      description,
    )
    ? description
    : explanations[option.value];
}
