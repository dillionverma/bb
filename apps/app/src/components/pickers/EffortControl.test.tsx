// @vitest-environment jsdom

import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReasoningLevel } from "@bb/domain";
import { CompactViewportOverrideProvider } from "@bb/shared-ui/hooks/use-compact-viewport";
import { EffortControl } from "./EffortControl";

const options = [
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
  { value: "max", label: "Max" },
  { value: "ultra", label: "Ultra" },
] as const;

afterEach(cleanup);

function Harness({
  disabled = false,
  compact = false,
  onChange = vi.fn(),
}: {
  disabled?: boolean;
  compact?: boolean;
  onChange?: (value: ReasoningLevel) => void;
}) {
  const [value, setValue] = useState<ReasoningLevel>("low");
  return (
    <CompactViewportOverrideProvider isCompactViewport={compact}>
      <EffortControl
        value={value}
        options={options}
        defaultValue="high"
        disabled={disabled}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    </CompactViewportOverrideProvider>
  );
}

describe("EffortControl", () => {
  it("commits only supported reasoning levels with keyboard input and excludes delegation modes", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const slider = screen.getByRole("slider", { name: "Thinking effort" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("high");
    expect(slider.getAttribute("aria-valuetext")).toBe("High");
    fireEvent.keyDown(slider, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("max");
    expect(slider.getAttribute("aria-valuemax")).toBe("2");
  });

  it("offers the model default and explicit execution modes through named choices", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Thinking effort: Low" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Reset to model default (High)" }),
    );
    expect(onChange).toHaveBeenLastCalledWith("high");
    fireEvent.click(screen.getByRole("radio", { name: "Ultra" }));
    expect(onChange).toHaveBeenLastCalledWith("ultra");
    expect(screen.queryByRole("slider")).toBeNull();
    expect(
      screen.getByText("Maximum reasoning with automatic task delegation."),
    ).not.toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Low" }));
    expect(onChange).toHaveBeenLastCalledWith("low");
  });

  it("does not emit changes when disabled", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} disabled />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "End" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses the shared drawer and named choices on compact screens", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} compact />);
    expect(screen.queryByRole("slider")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Thinking effort: Low" }),
    );
    fireEvent.click(await screen.findByRole("radio", { name: "High" }));
    expect(onChange).toHaveBeenCalledWith("high");
    expect(document.querySelector("[inert]")).toBeNull();
  });
});
