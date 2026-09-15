// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  markPluginFrontendBootStarted,
  markPluginFrontendsSettled,
  resetPluginFrontendBootStateForTest,
} from "@/lib/plugin-frontend-boot-state";
import {
  AUTOMATIC_REPLACEMENT_PROVIDER,
  BUILT_IN_REPLACEMENT_PROVIDER,
} from "@/lib/plugin-replacement-preference";
import {
  resetPluginSlotStoreForTest,
  setPluginSlotRegistrations,
} from "@/lib/plugin-slots";
import { makePluginRegistrationSet } from "@/test/fixtures/plugins";
import {
  readLastKnownThreadListProvider,
  resolveThreadListBootHold,
  THREAD_LIST_BOOT_HOLD_MAX_MS,
  useRememberThreadListProvider,
  useThreadListBootHold,
  writeLastKnownThreadListProvider,
} from "./threadListProvider";

const OWNER = { kind: "owner" } as const;
const WORKSPACES = { pluginId: "workspace-sidebar", id: "workspaces" };
const PLUGIN = {
  kind: "plugin",
  registration: {
    ...WORKSPACES,
    generation: 1,
    title: "Ultra Sidebar",
    component: () => null,
  },
} as const;

function registerPluginList() {
  setPluginSlotRegistrations(
    WORKSPACES.pluginId,
    makePluginRegistrationSet({
      threadLists: [
        { id: WORKSPACES.id, title: "Ultra Sidebar", component: () => null },
      ],
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  resetPluginSlotStoreForTest();
  resetPluginFrontendBootStateForTest();
  window.localStorage.clear();
});

describe("resolveThreadListBootHold", () => {
  const booting = {
    settled: false,
    timedOut: false,
    replacement: OWNER,
    preference: AUTOMATIC_REPLACEMENT_PROVIDER,
    remembered: WORKSPACES,
  };

  it("holds while booting when a plugin owned the list last time", () => {
    expect(resolveThreadListBootHold(booting)).toBe(true);
  });

  it("never holds without a remembered plugin", () => {
    expect(resolveThreadListBootHold({ ...booting, remembered: null })).toBe(
      false,
    );
  });

  it("releases once frontends settle or the ceiling passes", () => {
    expect(resolveThreadListBootHold({ ...booting, settled: true })).toBe(false);
    expect(resolveThreadListBootHold({ ...booting, timedOut: true })).toBe(
      false,
    );
  });

  it("stops holding as soon as the plugin list registers", () => {
    expect(resolveThreadListBootHold({ ...booting, replacement: PLUGIN })).toBe(
      false,
    );
  });

  it("respects a pinned built-in list and a pin on another plugin", () => {
    expect(
      resolveThreadListBootHold({
        ...booting,
        preference: BUILT_IN_REPLACEMENT_PROVIDER,
      }),
    ).toBe(false);
    expect(
      resolveThreadListBootHold({ ...booting, preference: "other/list" }),
    ).toBe(false);
    expect(
      resolveThreadListBootHold({
        ...booting,
        preference: "workspace-sidebar/workspaces",
      }),
    ).toBe(true);
  });
});

describe("useThreadListBootHold", () => {
  it("holds the built-in list until plugin frontends settle", () => {
    writeLastKnownThreadListProvider(WORKSPACES);
    const { result } = renderHook(() => useThreadListBootHold(OWNER));
    expect(result.current).toBe(true);

    act(() => {
      markPluginFrontendBootStarted();
      markPluginFrontendsSettled();
    });
    expect(result.current).toBe(false);
  });

  it("does not hold on a first boot with nothing remembered", () => {
    const { result } = renderHook(() => useThreadListBootHold(OWNER));
    expect(result.current).toBe(false);
  });

  it("gives up after the ceiling even if boot never settles", () => {
    vi.useFakeTimers();
    writeLastKnownThreadListProvider(WORKSPACES);
    const { result } = renderHook(() => useThreadListBootHold(OWNER));
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(THREAD_LIST_BOOT_HOLD_MAX_MS);
    });
    expect(result.current).toBe(false);
  });
});

describe("useRememberThreadListProvider", () => {
  it("remembers the plugin list once boot completes, and forgets it when bb's list is back", () => {
    registerPluginList();
    const { rerender } = renderHook(() => useRememberThreadListProvider());
    expect(readLastKnownThreadListProvider()).toBeNull();

    act(() => {
      markPluginFrontendBootStarted();
      markPluginFrontendsSettled();
    });
    expect(readLastKnownThreadListProvider()).toEqual(WORKSPACES);

    act(() => {
      resetPluginSlotStoreForTest();
    });
    rerender();
    expect(readLastKnownThreadListProvider()).toBeNull();
  });
});
