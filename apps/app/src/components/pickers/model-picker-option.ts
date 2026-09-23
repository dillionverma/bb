import type { PickerOption } from "./OptionPicker";
import type { ReasoningLevel } from "@bb/domain";

export interface ModelPickerOption extends PickerOption<string> {
  routeProviderId?: string;
  defaultReasoningEffort?: ReasoningLevel;
}
