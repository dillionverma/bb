import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { createLastKnownCache } from "@/lib/last-known-cache";
import {
  usePluginFrontendBootComplete,
  usePluginFrontendsSettled,
} from "@/lib/plugin-frontend-boot-state";
import {
  AUTOMATIC_REPLACEMENT_PROVIDER,
  BUILT_IN_REPLACEMENT_PROVIDER,
  replacementProviderKey,
  resolvePreferredReplacement,
} from "@/lib/plugin-replacement-preference";
import { createSyncedPreferenceAtom } from "@/lib/ui-preferences/synced-preference-atom";
import type { ResolvedReplacement } from "@/lib/plugin-slot-resolvers";
import { usePluginSlots, type PluginThreadListSlot } from "@/lib/plugin-slots";

export const threadListProviderAtom = createSyncedPreferenceAtom(
  "sidebar.threadListProvider",
);

export function useThreadListReplacement(): ResolvedReplacement<PluginThreadListSlot> {
  const { threadLists } = usePluginSlots();
  const preference = useAtomValue(threadListProviderAtom);
  return resolvePreferredReplacement(threadLists, preference);
}

const lastKnownThreadListProviderSchema = z.object({
  pluginId: z.string().min(1),
  id: z.string().min(1),
});

export type LastKnownThreadListProvider = z.infer<
  typeof lastKnownThreadListProviderSchema
>;

const providerCache = createLastKnownCache({
  prefix: "bb.sidebar.thread-list-provider",
  version: "1",
  schema: lastKnownThreadListProviderSchema,
});
const PROVIDER_CACHE_KEY = providerCache.key("last");

export function readLastKnownThreadListProvider(): LastKnownThreadListProvider | null {
  return providerCache.read(PROVIDER_CACHE_KEY);
}

export function writeLastKnownThreadListProvider(
  provider: LastKnownThreadListProvider | null,
): void {
  if (provider === null) providerCache.clear();
  else providerCache.write(PROVIDER_CACHE_KEY, provider);
}

export const THREAD_LIST_BOOT_HOLD_MAX_MS = 8_000;

export function resolveThreadListBootHold({
  settled,
  timedOut,
  replacement,
  preference,
  remembered,
}: {
  settled: boolean;
  timedOut: boolean;
  replacement: ResolvedReplacement<PluginThreadListSlot>;
  preference: string;
  remembered: LastKnownThreadListProvider | null;
}): boolean {
  if (settled || timedOut) return false;
  if (replacement.kind === "plugin") return false;
  if (remembered === null) return false;
  if (preference === BUILT_IN_REPLACEMENT_PROVIDER) return false;
  return (
    preference === AUTOMATIC_REPLACEMENT_PROVIDER ||
    preference === replacementProviderKey(remembered)
  );
}

export function useThreadListBootHold(
  replacement: ResolvedReplacement<PluginThreadListSlot>,
): boolean {
  const settled = usePluginFrontendsSettled();
  const preference = useAtomValue(threadListProviderAtom);
  const remembered = useMemo(
    () => (settled ? null : readLastKnownThreadListProvider()),
    [settled],
  );
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (remembered === null) return;
    const timeout = window.setTimeout(
      () => setTimedOut(true),
      THREAD_LIST_BOOT_HOLD_MAX_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [remembered]);
  return resolveThreadListBootHold({
    settled,
    timedOut,
    replacement,
    preference,
    remembered,
  });
}

export function useRememberThreadListProvider(): void {
  const bootComplete = usePluginFrontendBootComplete();
  const replacement = useThreadListReplacement();
  const provider =
    replacement.kind === "plugin"
      ? {
          pluginId: replacement.registration.pluginId,
          id: replacement.registration.id,
        }
      : null;
  const pluginId = provider?.pluginId ?? null;
  const id = provider?.id ?? null;
  useEffect(() => {
    if (!bootComplete) return;
    writeLastKnownThreadListProvider(
      pluginId === null || id === null ? null : { pluginId, id },
    );
  }, [bootComplete, pluginId, id]);
}
