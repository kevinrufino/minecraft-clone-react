import { allMinecraft } from "../../images/images";
import { tileFor, ATLAS_GRID_SIZE } from "../../world/atlas";

// Renders a single texture-atlas tile as a pixelated thumbnail using a CSS
// background, so the whole block palette comes straight from allMinecraft.jpeg
// without separate per-block image files. `face` picks which face of a
// multi-face block to show (default "side").
export function AtlasTile({ texture, size = 38, face = "side" }) {
  const [col, row] = tileFor(texture, face);
  const N = ATLAS_GRID_SIZE; // 16
  // tiles are 1-indexed from the bottom-left; CSS background-position counts y
  // from the top, so invert the row
  const posX = ((col - 1) / (N - 1)) * 100;
  const posY = ((N - row) / (N - 1)) * 100;
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${allMinecraft})`,
        backgroundSize: `${N * 100}% ${N * 100}%`,
        backgroundPosition: `${posX}% ${posY}%`,
        imageRendering: "pixelated",
      }}
    />
  );
}
