import { useEffect } from "react";
import { useStore } from "../hooks/useStore";
import { dirtImg, grassImg, glassImg, logImg, woodImg } from "../images/images";

const images = {
  dirt: dirtImg,
  grass: grassImg,
  glass: glassImg,
  wood: woodImg,
  log: logImg,
};

const texturesArray = Object.keys(images);

// 9 hotbar slots: first 5 have textures, last 4 are empty
const HOTBAR_SLOTS = 9;

export const TextureSelector = ({ activeTextureREF }) => {
  const [activeTexture, setTexture] = useStore((state) => [
    state.texture,
    state.setTexture,
  ]);

  useEffect(() => {
    function pickTexture(texture) {
      setTexture(texture);
      activeTextureREF.current = texture;
    }

    function handleWheel(event) {
      const delta = Math.sign(event.deltaY);
      const nextPos = texturesArray.indexOf(activeTexture) + delta;
      if (nextPos >= 0 && nextPos < texturesArray.length) {
        pickTexture(texturesArray[nextPos]);
      }
    }

    // 1-9 select hotbar slots directly (only filled slots respond)
    function handleKeyDown(event) {
      const m = /^Digit([1-9])$/.exec(event.code);
      if (!m) {
        return;
      }
      const slot = Number(m[1]) - 1;
      if (texturesArray[slot]) {
        pickTexture(texturesArray[slot]);
      }
    }

    window.addEventListener("wheel", handleWheel);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [setTexture, activeTexture, activeTextureREF]);

  const slots = Array.from({ length: HOTBAR_SLOTS }, (_, i) => {
    const key = texturesArray[i] || null;
    return { key, src: key ? images[key] : null };
  });

  return (
    <div className="hotbar">
      {slots.map((slot, i) => {
        const isActive = slot.key === activeTexture;
        return (
          <div
            key={i}
            className={`hotbar__slot${isActive ? " hotbar__slot--active" : ""}`}
          >
            {slot.src && (
              <img src={slot.src} alt={slot.key} className="hotbar__img" />
            )}
          </div>
        );
      })}
    </div>
  );
};
