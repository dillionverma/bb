import { memo, type CSSProperties } from "react";
import { APP_OVERLAY_LAYER } from "@/components/ui/app-overlay-layers";
import { SidebarShelfCompanion } from "@/components/ui/sidebar";
import {
  usePluginSlots,
  type ExperimentalAppOverlaySlot,
} from "@/lib/plugin-slots";
import { PluginSlotMount } from "./PluginSlotMount";

const PLUGIN_APP_OVERLAY_FRAME_CLASS =
  "contents max-md:pointer-events-auto group-data-[shelf-engaged]/sidebar-shelf-companion:pointer-events-none";

const pluginAppOverlaysStyle = {
  zIndex: APP_OVERLAY_LAYER.pluginAppOverlays,
} satisfies CSSProperties;

const PluginAppOverlay = memo(function PluginAppOverlay({
  slot,
}: {
  slot: ExperimentalAppOverlaySlot;
}) {
  const Component = slot.component;
  return (
    <div
      data-bb-plugin-app-overlay-frame=""
      className={PLUGIN_APP_OVERLAY_FRAME_CLASS}
    >
      <PluginSlotMount
        pluginId={slot.pluginId}
        slotKind="appOverlay"
        slotId={slot.id}
        crashFallback={null}
      >
        <Component />
      </PluginSlotMount>
    </div>
  );
});

export function PluginAppOverlays() {
  const { appOverlays } = usePluginSlots();
  if (appOverlays.length === 0) return null;

  return (
    <SidebarShelfCompanion
      data-bb-plugin-app-overlays=""
      style={pluginAppOverlaysStyle}
    >
      {appOverlays.map((slot) => (
        <PluginAppOverlay
          key={`${slot.pluginId}/${slot.id}/${slot.generation}`}
          slot={slot}
        />
      ))}
    </SidebarShelfCompanion>
  );
}
