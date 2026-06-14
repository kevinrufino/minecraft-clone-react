import { useStore } from "../../hooks/useStore";
import { AMTmapkeys } from "../../world/atlas";
import { AtlasTile } from "./AtlasTile";

// Blocks that exist in the atlas but aren't offered as placeable items.
const HIDDEN = new Set(["water", "ground"]);
const BLOCKS = AMTmapkeys.filter((k) => !HIDDEN.has(k));

// turn "mossyCobblestone" into "Mossy Cobblestone" for tooltips/labels
function prettyName(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase());
}

// Creative-style inventory. Open with E, click a block to drop it into the
// currently selected hotbar slot (click a hotbar slot below to change which).
export function Inventory() {
  const inventoryOpen = useStore((s) => s.inventoryOpen);
  const hotbar = useStore((s) => s.hotbar);
  const selectedSlot = useStore((s) => s.selectedSlot);
  const setHotbarSlot = useStore((s) => s.setHotbarSlot);
  const setSelectedSlot = useStore((s) => s.setSelectedSlot);
  const setInventoryOpen = useStore((s) => s.setInventoryOpen);

  if (!inventoryOpen) {
    return null;
  }

  return (
    <div className="inventory" onClick={() => setInventoryOpen(false)}>
      <div className="inventory__panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="inventory__title">Creative Inventory</h2>
        <p className="inventory__hint">
          Click a block to put it in hotbar slot {selectedSlot + 1}. Press E or
          Esc to close.
        </p>

        <div className="inventory__grid">
          {BLOCKS.map((block) => (
            <button
              key={block}
              type="button"
              className="inventory__cell"
              title={prettyName(block)}
              onClick={() => setHotbarSlot(selectedSlot, block)}
            >
              <AtlasTile texture={block} size={40} />
            </button>
          ))}
        </div>

        <div className="inventory__hotbar">
          {hotbar.map((key, i) => (
            <button
              key={i}
              type="button"
              className={`inventory__slot${
                i === selectedSlot ? " inventory__slot--active" : ""
              }`}
              onClick={() => setSelectedSlot(i)}
            >
              {key && <AtlasTile texture={key} size={34} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
