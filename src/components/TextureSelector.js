import { useEffect } from "react";
import { useStore } from "../hooks/useStore";
import { AtlasTile } from "./UIComponents/AtlasTile";

// The hotbar. Slots and the selected index live in the store so the creative
// inventory (E) can reassign them. The selected slot's block is mirrored into
// store.texture + activeTextureREF, which the placement code reads.
export const TextureSelector = ({ activeTextureREF }) => {
  const hotbar = useStore((s) => s.hotbar);
  const selectedSlot = useStore((s) => s.selectedSlot);
  const setTexture = useStore((s) => s.setTexture);

  // keep the active placement texture in sync with the selected slot
  useEffect(() => {
    const tex = hotbar[selectedSlot] || "dirt";
    setTexture(tex);
    activeTextureREF.current = tex;
  }, [hotbar, selectedSlot, setTexture, activeTextureREF]);

  useEffect(() => {
    function handleWheel(event) {
      const st = useStore.getState();
      if (st.inventoryOpen) {
        return; // wheel scrolls the inventory, not the hotbar
      }
      const n = st.hotbar.length;
      const delta = Math.sign(event.deltaY);
      st.setSelectedSlot((st.selectedSlot + delta + n) % n);
    }

    // 1-9 select hotbar slots directly
    function handleKeyDown(event) {
      const m = /^Digit([1-9])$/.exec(event.code);
      if (!m) {
        return;
      }
      const st = useStore.getState();
      const slot = Number(m[1]) - 1;
      if (slot < st.hotbar.length) {
        st.setSelectedSlot(slot);
      }
    }

    window.addEventListener("wheel", handleWheel);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="hotbar">
      {hotbar.map((key, i) => {
        const isActive = i === selectedSlot;
        return (
          <div
            key={i}
            className={`hotbar__slot${isActive ? " hotbar__slot--active" : ""}`}
          >
            {key && <AtlasTile texture={key} size={38} />}
          </div>
        );
      })}
    </div>
  );
};
