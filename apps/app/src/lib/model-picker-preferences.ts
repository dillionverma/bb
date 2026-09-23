import { useAtom } from "jotai";
import { createSyncedPreferenceAtom } from "./ui-preferences/synced-preference-atom";

const pinnedModelsAtom = createSyncedPreferenceAtom("modelPicker.pinnedModels");

export function usePinnedModels(providerId: string) {
  const [entries, setEntries] = useAtom(pinnedModelsAtom);
  return {
    pinnedModels: entries
      .filter((entry) => entry.providerId === providerId)
      .map((entry) => entry.model),
    togglePin: (model: string) =>
      setEntries((current) => {
        const exists = current.some(
          (entry) => entry.providerId === providerId && entry.model === model,
        );
        return exists
          ? current.filter(
              (entry) =>
                entry.providerId !== providerId || entry.model !== model,
            )
          : current.length < 100
            ? [...current, { providerId, model }]
            : current;
      }),
  };
}
