// Texture atlas lookup for allMinecraft.jpeg.
// The atlas is a 16x16 grid; each entry is the 1-indexed [column, row]
// of a tile counted from the bottom-left of the image.
export const ATLAS_GRID_SIZE = 16;
export const ATLAS_UV_SIZE = 1 / ATLAS_GRID_SIZE;

export const AMTmap = {
  dirt: [3, 16],
  wood: [5, 16],
  grass: [5, 3],
  sand: [3, 15],
  ground: [8, 11],
  barktop: [6, 15],
  log: [5, 15],
  bedrock: [2, 15],
  glass: [3, 5],
};

export const AMTmapkeys = Object.keys(AMTmap);
