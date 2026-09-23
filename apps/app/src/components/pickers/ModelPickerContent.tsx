import { useMemo, type RefObject } from "react";
import { Button } from "@bb/shared-ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@bb/shared-ui/command";
import { Icon } from "@bb/shared-ui/icon";
import { searchPickerOptions } from "./picker-search";
import type { ModelPickerOption } from "./model-picker-option";

export interface ModelPickerContentProps {
  providerLabel: string;
  options: readonly ModelPickerOption[];
  value: string;
  pinnedModels: readonly string[];
  onTogglePin: (model: string) => void;
  onSelect: (model: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}

export function ModelPickerContent({
  providerLabel,
  options,
  value,
  pinnedModels,
  onTogglePin,
  onSelect,
  query,
  onQueryChange,
  inputRef,
  disabled = false,
}: ModelPickerContentProps) {
  const matches = useMemo(
    () =>
      searchPickerOptions({
        options,
        query,
        getLabel: (option) => option.label,
        getAliases: (option) => [
          option.value,
          providerLabel,
          option.routeProviderId ?? "",
        ],
      }),
    [options, providerLabel, query],
  );
  const pinned = [...new Set(pinnedModels)].flatMap((model) => {
    const option = matches.find((option) => option.value === model);
    return option ? [option] : [];
  });
  const other = matches.filter(
    (option) => !pinnedModels.includes(option.value),
  );
  const groups = [
    { label: "Pinned", options: pinned },
    { label: "Models", options: other },
  ];

  return (
    <Command
      label="Search models"
      shouldFilter={false}
      loop
      className="min-h-0 flex-1"
    >
      <CommandInput
        ref={inputRef}
        placeholder={`Search ${providerLabel} models`}
        aria-label="Search models"
        value={query}
        onValueChange={onQueryChange}
      />
      <CommandList aria-label="Models" className="max-h-72 scroll-py-1">
        {matches.length === 0 ? (
          <div
            role="status"
            className="px-3 py-6 text-center text-sm text-muted-foreground"
          >
            No models match your search
          </div>
        ) : null}
        {groups.map((group) =>
          group.options.length > 0 ? (
            <CommandGroup key={group.label} heading={group.label}>
              {group.options.map((option) => {
                const isPinned = pinnedModels.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center gap-1">
                    <CommandItem
                      value={option.value}
                      aria-label={option.label}
                      disabled={disabled || option.disabled}
                      onSelect={() => onSelect(option.value)}
                      className="min-h-9 min-w-0 flex-1"
                      aria-description={option.description}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                      {option.routeProviderId ? (
                        <span className="text-xs text-muted-foreground">
                          {option.routeProviderId}
                        </span>
                      ) : null}
                      {option.value === value ? (
                        <Icon name="Check" aria-hidden="true" />
                      ) : null}
                    </CommandItem>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`${isPinned ? "Unpin" : "Pin"} ${option.label}`}
                      aria-pressed={isPinned}
                      disabled={disabled}
                      onKeyDown={(event) => event.stopPropagation()}
                      onClick={() => onTogglePin(option.value)}
                    >
                      <Icon name={isPinned ? "PinOff" : "Pin"} />
                    </Button>
                  </div>
                );
              })}
            </CommandGroup>
          ) : null,
        )}
      </CommandList>
    </Command>
  );
}
