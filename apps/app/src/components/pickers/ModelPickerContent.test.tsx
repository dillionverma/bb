// @vitest-environment jsdom

import { useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelPickerContent } from "./ModelPickerContent";

afterEach(cleanup);

const options = [
  { value: "everyday", label: "Everyday" },
  { value: "deep", label: "Deep work" },
  { value: "quick", label: "Quick" },
];

function Harness({
  onSelect = vi.fn(),
}: {
  onSelect?: (value: string) => void;
}) {
  const [pinnedModels, setPins] = useState(["quick"]);
  const [query, setQuery] = useState("");
  return (
    <ModelPickerContent
      providerLabel="Codex"
      options={options}
      value="everyday"
      query={query}
      onQueryChange={setQuery}
      pinnedModels={pinnedModels}
      onTogglePin={(model) =>
        setPins((current) =>
          current.includes(model)
            ? current.filter((value) => value !== model)
            : [...current, model],
        )
      }
      onSelect={onSelect}
    />
  );
}

describe("ModelPickerContent", () => {
  it("keeps pins in their saved order without selecting the model", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Pin Deep work" }));
    const pinned = screen.getByRole("group", { name: "Pinned" });
    expect(
      within(pinned)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Quick", "Deep work"]);
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Unpin Quick" }));
    expect(
      within(pinned)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Deep work"]);
  });

  it("searches the full catalog, selects with the keyboard, and shows an empty result", async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByRole("combobox", { name: "Search models" });
    fireEvent.change(input, { target: { value: "deep" } });
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("deep");
    fireEvent.change(input, { target: { value: "zzzz" } });
    expect(screen.getByRole("status").textContent).toBe(
      "No models match your search",
    );
  });
});
