// Texture atlas lookup for allMinecraft.jpeg (classic terrain.png layout).
// The atlas is a 16x16 grid; tiles are 1-indexed [column, row] counted from
// the bottom-left of the image.
export const ATLAS_GRID_SIZE = 16;
export const ATLAS_UV_SIZE = 1 / ATLAS_GRID_SIZE;

// Either a single [col, row] tile for all faces, or { top, side, bottom }.
// Tiles are 1-indexed [col, row] from the bottom-left of the 16x16 atlas, i.e.
// [tx + 1, 16 - ty] for the (tx, ty) tile of the classic terrain.png layout.
export const AMTmap = {
  grass: { top: [1, 16], side: [4, 16], bottom: [3, 16] },
  dirt: [3, 16],
  stone: [2, 16],
  cobblestone: [1, 15],
  wood: [5, 16],
  sand: [3, 15],
  ground: [8, 11],
  log: { top: [6, 15], side: [5, 15], bottom: [6, 15] },
  bedrock: [2, 15],
  glass: [2, 13],
  leaves: [5, 13],
  cactus: { top: [6, 12], side: [7, 12], bottom: [8, 12] },
  water: [15, 4], // not used for rendering (water draws as tinted material)

  // ── extra placeable blocks (creative inventory) ──────────────────
  gravel: [4, 15],
  brick: [8, 16],
  bookshelf: { top: [5, 16], side: [4, 14], bottom: [5, 16] },
  mossyCobblestone: [5, 14],
  obsidian: [6, 14],
  sponge: [1, 13],
  wool: [1, 12],
  snow: [3, 12],
  ice: [4, 12],
  clay: [9, 12],
  coalOre: [3, 14],
  ironOre: [2, 14],
  goldOre: [1, 14],
  diamondOre: [3, 13],
  redstoneOre: [4, 13],
  ironBlock: [7, 15],
  goldBlock: [8, 15],
  diamondBlock: [9, 15],
  tnt: { top: [10, 16], side: [9, 16], bottom: [11, 16] },
};

export const AMTmapkeys = Object.keys(AMTmap);

// face: "top" | "side" | "bottom"
export function tileFor(texture, face) {
  const entry = AMTmap[texture] || AMTmap.dirt;
  if (Array.isArray(entry)) {
    return entry;
  }
  return entry[face] || entry.side;
}

// Blocks rendered in the transparent pass (tinted material, no atlas map).
// Leaves/glass stay opaque because the atlas is a JPEG with no alpha channel
// (same trade-off as Minecraft's "fast graphics" leaves).
export const TRANSPARENT_TEXTURES = ["water"];

// The classic grass-top tile is grayscale and gets tinted green; everything
// else renders untinted. Values are RGB multipliers baked into vertex colors.
export const GRASS_TINT = [0.55, 0.85, 0.4];

// Classic Minecraft per-face shading, baked into vertex colors.
export const FACE_SHADE = {
  top: 1.0,
  bottom: 0.5,
  north: 0.8, // +-z faces
  south: 0.8,
  east: 0.6, // +-x faces
  west: 0.6,
};
