import type { ComponentProps } from "react";
import { ModelReasoningPicker } from "./ModelReasoningPicker";
import { EffortControl } from "./EffortControl";

export function ModelControls(
  props: ComponentProps<typeof ModelReasoningPicker>,
) {
  const model = [...props.modelOptions, ...(props.moreModelOptions ?? [])].find(
    (option) => option.value === props.modelValue,
  );
  const showEffort =
    !props.modelIsLoading &&
    !props.modelLoadFailed &&
    !props.modelLoadError &&
    Boolean(model) &&
    !props.handoff?.active;
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-1"
      data-model-controls=""
    >
      <ModelReasoningPicker {...props} separateEffort />
      {showEffort ? (
        <EffortControl
          key={`${props.selectedProviderId}:${props.modelValue}`}
          value={props.reasoningValue}
          options={props.reasoningOptions}
          defaultValue={model?.defaultReasoningEffort}
          onChange={props.onReasoningChange}
          disabled={props.disabled}
        />
      ) : null}
    </div>
  );
}
