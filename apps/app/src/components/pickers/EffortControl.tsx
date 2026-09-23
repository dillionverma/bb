import { useId, useState } from "react";
import type { ReasoningLevel } from "@bb/domain";
import { Button } from "@bb/shared-ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@bb/shared-ui/popover";
import { Slider } from "@bb/shared-ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@bb/shared-ui/toggle-group";
import { Icon } from "@bb/shared-ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bb/shared-ui/tooltip";
import { useIsCompactViewport } from "@bb/shared-ui/hooks/use-compact-viewport";
import { cn } from "@bb/shared-ui/lib/utils";
import type { PickerOption } from "./OptionPicker";
import { effortDescription, isExecutionMode } from "./effort-options";

export interface EffortControlProps {
  value: ReasoningLevel;
  options: readonly PickerOption<ReasoningLevel>[];
  defaultValue?: ReasoningLevel;
  onChange: (value: ReasoningLevel) => void;
  disabled?: boolean;
}

export function EffortControl({
  value,
  options,
  defaultValue,
  onChange,
  disabled = false,
}: EffortControlProps) {
  const compact = useIsCompactViewport();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{
    base: ReasoningLevel;
    value: ReasoningLevel;
  } | null>(null);
  const descriptionId = useId();
  const levels = options.filter((option) => !isExecutionMode(option.value));
  const modes = options.filter((option) => isExecutionMode(option.value));
  const displayedValue = draft?.base === value ? draft.value : value;
  const selected = options.find((option) => option.value === displayedValue);
  const selectedIndex = levels.findIndex(
    (option) => option.value === displayedValue,
  );
  const defaultOption = options.find((option) => option.value === defaultValue);
  if (!selected || options.length < 2) return null;

  const select = (next: ReasoningLevel) => {
    if (
      disabled ||
      !options.some((option) => option.value === next && !option.disabled)
    )
      return;
    setDraft(null);
    onChange(next);
  };
  const slider =
    levels.length > 1 && selectedIndex >= 0 ? (
      <Slider
        min={0}
        max={levels.length - 1}
        step={1}
        value={[selectedIndex]}
        disabled={disabled}
        className="w-24 shrink-0 py-2"
        thumbProps={{
          "aria-label": "Thinking effort",
          "aria-valuetext": selected.label,
          "aria-description": effortDescription(selected),
        }}
        onValueChange={([index]) => {
          const option = levels[index];
          if (option && !disabled)
            setDraft({ base: value, value: option.value });
        }}
        onValueCommit={([index]) => {
          const option = levels[index];
          if (option) select(option.value);
        }}
        onPointerCancel={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setDraft(null);
            event.stopPropagation();
          }
        }}
      />
    ) : null;

  return (
    <div
      className="flex min-w-0 items-center gap-2"
      role="group"
      aria-label="Thinking effort controls"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  aria-label={`Thinking effort: ${selected.label}`}
                >
                  <Icon name="SlidersHorizontal" data-icon="inline-start" />
                  <span>{selected.label}</span>
                  <Icon name="ChevronDown" data-icon="inline-end" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>{effortDescription(selected)}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent
          align="start"
          mobileTitle="Thinking effort"
          className="flex w-80 flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Thinking effort</span>
            <p
              id={descriptionId}
              className="text-xs text-muted-foreground"
              aria-live="polite"
            >
              {effortDescription(selected)}
            </p>
          </div>
          <EffortChoices
            label="Reasoning"
            options={levels}
            value={value}
            onChange={select}
            disabled={disabled}
            defaultValue={defaultValue}
          />
          {modes.length > 0 ? (
            <EffortChoices
              label="Execution modes"
              options={modes}
              value={value}
              onChange={select}
              disabled={disabled}
            />
          ) : null}
          {defaultOption ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || value === defaultOption.value}
              onClick={() => select(defaultOption.value)}
            >
              Reset to model default ({defaultOption.label})
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Applies to your next message. More effort can use more time and
            allowance; it does not guarantee a better answer.
          </p>
        </PopoverContent>
      </Popover>
      {!compact ? slider : null}
    </div>
  );
}

function EffortChoices({
  label,
  options,
  value,
  onChange,
  disabled,
  defaultValue,
}: {
  label: string;
  options: readonly PickerOption<ReasoningLevel>[];
  value: ReasoningLevel;
  onChange: (value: ReasoningLevel) => void;
  disabled: boolean;
  defaultValue?: ReasoningLevel;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <ToggleGroup
        type="single"
        aria-label={label}
        value={value}
        disabled={disabled}
        className="flex flex-wrap justify-start gap-1"
        onValueChange={(next) => {
          const option = options.find((option) => option.value === next);
          if (option) onChange(option.value);
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.label}
            aria-description={effortDescription(option)}
            disabled={option.disabled}
            className={cn(
              "min-h-9",
              option.value === defaultValue &&
                "underline decoration-dotted underline-offset-4",
            )}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
