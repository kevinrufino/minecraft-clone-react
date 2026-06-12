import { useEffect } from "react";
import { useKeyboard } from "../hooks/useKeyboard";
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

export const TextureSelector = ({ activeTextureREF }) => {
  const [activeTexture, setTexture] = useStore((state) => [
    state.texture,
    state.setTexture,
  ]);
  const { dirt, grass, glass, wood, log } = useKeyboard();

  useEffect(() => {
    function pickTexture(texture) {
      setTexture(texture);
      activeTextureREF.current = texture;
    }

    const pressedTexture = Object.entries({
      dirt,
      grass,
      glass,
      wood,
      log,
    }).find(([k, v]) => v.on);

    function handleWheel(event) {
      const delta = Math.sign(event.deltaY);
      const nextPos = texturesArray.indexOf(activeTexture) + delta;
      if (nextPos >= 0 && nextPos < texturesArray.length) {
        pickTexture(texturesArray[nextPos]);
      }
    }

    window.addEventListener("wheel", handleWheel);
    if (pressedTexture) {
      pickTexture(pressedTexture[0]);
    }
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [setTexture, dirt, grass, glass, wood, log, activeTexture]);

  return (
    <div className="absolute centered-bottom texture-selector">
      {Object.entries(images).map(([k, src]) => {
        return (
          <img
            key={k}
            src={src}
            alt={k}
            className={`${k === activeTexture ? "active" : ""}`}
          />
        );
      })}
    </div>
  );
};
