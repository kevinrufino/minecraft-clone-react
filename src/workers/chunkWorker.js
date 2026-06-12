import { createNoise2D } from "simplex-noise";
import alea from "alea";
import { makeKey } from "../world/keys";
import { parseChunkKey } from "../world/chunkMath";
import { genFaceArrays, packDrawArrays } from "../world/meshGen";

let worldSet = {};

onmessage = (e) => {
  if (e.data.init) {
    initializeWorker(e.data.init);
  } else if (e.data.worldFill) {
    initialFill(e.data.worldFill);
  } else if (e.data.userChange) {
    regularFlow(e.data.userChange);
  } else {
    console.error(
      `[WORKER-${worldSet.w_ind}] unknown task given:`,
      Object.keys(e.data),
    );
  }
};

function initializeWorker(init) {
  worldSet = { ...init.worldSettings };
  worldSet.genNoise2D = createNoise2D(alea(worldSet.seed));
  worldSet.seedNum = String(worldSet.seed)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0) * 31, 7);

  postMessage({ init: true });
}

// Deterministic per-position hash in [0,1) -- trees must land on the same
// columns no matter which chunk (or which worker) generates them.
function hash01(x, z, salt) {
  let h = (x | 0) * 374761393 + (z | 0) * 668265263 + salt * 1274126177;
  h = (h ^ (h >> 13)) * 1103515245;
  h = h ^ (h >> 16);
  return (h >>> 0) / 4294967296;
}

// Rebuilds a single chunk's mesh after a block was placed or removed.
function regularFlow(data) {
  const { t, blocks, chunkBlocks, chunkKey } = data;

  const draw = packDrawArrays(genFaceArrays(t, blocks, chunkBlocks));
  postMessage({
    regFlow: {
      draw,
      count: chunkBlocks.count,
      chunkKey,
    },
  });
}

// Terrain column height from two octaves of seeded noise. Shifted down so
// low areas dip below sea level and fill with water.
function surfaceHeight(x, z) {
  const noise2D = worldSet.genNoise2D;
  const broad = (noise2D(x / 100, z / 100) + 1) / 2; // rolling hills
  const detail = (noise2D(x / 25, z / 25) + 1) / 2; // small bumps
  return Math.floor(broad * worldSet.heightFactor + detail * 3) - 3;
}

function columnBlocks(x, z, info, infoList) {
  const h = surfaceHeight(x, z);
  const { minY, waterLevel } = worldSet;
  const beach = h <= waterLevel + 1;

  for (let y = minY; y <= h; y++) {
    let texture;
    if (y === minY) {
      texture = "bedrock";
    } else if (y === h) {
      texture = beach ? "sand" : "grass";
    } else if (y >= h - 3) {
      texture = beach ? "sand" : "dirt";
    } else {
      texture = "stone";
    }
    const key = makeKey(x, y, z);
    infoList.push(key);
    info[key] = { pos: [x, y, z], texture };
  }

  // fill up to sea level with water
  for (let y = h + 1; y <= waterLevel; y++) {
    const key = makeKey(x, y, z);
    infoList.push(key);
    info[key] = { pos: [x, y, z], texture: "water" };
  }
}

const TREE_CHANCE = 0.012;
const TREE_MARGIN = 2; // canopy radius -- trees this close outside a chunk spill into it

// Returns the tree rooted at column (x,z), or null. Deterministic.
function treeAt(x, z) {
  if (hash01(x, z, worldSet.seedNum) >= TREE_CHANCE) {
    return null;
  }
  const h = surfaceHeight(x, z);
  if (h <= worldSet.waterLevel + 1) {
    return null; // no trees on beaches or underwater
  }
  const trunkH = 4 + Math.floor(hash01(x, z, worldSet.seedNum + 1) * 3);
  return { x, z, baseY: h + 1, topY: h + trunkH };
}

// Writes the tree's blocks that fall inside the chunk bounds [x0,x1)x[z0,z1).
function placeTree(tree, x0, x1, z0, z1, info, infoList) {
  const put = (x, y, z, texture) => {
    if (x < x0 || x >= x1 || z < z0 || z >= z1) {
      return;
    }
    const key = makeKey(x, y, z);
    if (info[key] && info[key].texture !== "water") {
      return; // never overwrite solid terrain
    }
    if (!info[key]) {
      infoList.push(key);
    }
    info[key] = { pos: [x, y, z], texture };
  };

  // canopy: two wide layers around the trunk top, then a small cap
  for (let y = tree.topY - 1; y <= tree.topY; y++) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) === 2 && Math.abs(dz) === 2) {
          continue; // clip corners
        }
        put(tree.x + dx, y, tree.z + dz, "leaves");
      }
    }
  }
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      put(tree.x + dx, tree.topY + 1, tree.z + dz, "leaves");
    }
  }
  put(tree.x, tree.topY + 2, tree.z, "leaves");

  // trunk last so it wins over leaves
  for (let y = tree.baseY; y <= tree.topY; y++) {
    const key = makeKey(tree.x, y, tree.z);
    if (tree.x >= x0 && tree.x < x1 && tree.z >= z0 && tree.z < z1) {
      if (!info[key] || info[key].texture === "leaves") {
        if (!info[key]) {
          infoList.push(key);
        }
        info[key] = { pos: [tree.x, y, tree.z], texture: "log" };
      }
    }
  }
}

// Generates terrain blocks for a batch of chunks, applies player edits,
// then meshes them.
function initialFill({ chunks, edits }) {
  const fillRes = {};
  const cS = worldSet.chunkSize;

  chunks.forEach((ck) => {
    const { cx, cz } = parseChunkKey(ck);
    const info = {};
    const infoList = [];

    const x0 = cS * cx;
    const z0 = cS * cz;
    for (let x = x0; x < x0 + cS; x++) {
      for (let z = z0; z < z0 + cS; z++) {
        columnBlocks(x, z, info, infoList);
      }
    }

    // trees: scan a margin beyond the chunk so neighbors' canopies spill in
    for (let x = x0 - TREE_MARGIN; x < x0 + cS + TREE_MARGIN; x++) {
      for (let z = z0 - TREE_MARGIN; z < z0 + cS + TREE_MARGIN; z++) {
        const tree = treeAt(x, z);
        if (tree) {
          placeTree(tree, x0, x0 + cS, z0, z0 + cS, info, infoList);
        }
      }
    }

    fillRes[ck] = { info, infoList };
  });

  // overlay player edits (adds/removes recorded against generated terrain)
  if (edits) {
    const chunkSet = {};
    chunks.forEach((ck) => {
      chunkSet[ck] = fillRes[ck];
    });
    Object.entries(edits).forEach(([blockKey, event]) => {
      const cx = Math.floor(event.pos[0] / cS);
      const cz = Math.floor(event.pos[2] / cS);
      const res = chunkSet[cx + "." + cz];
      if (!res) {
        return;
      }
      if (event.type === "add") {
        if (!res.info[blockKey]) {
          res.infoList.push(blockKey);
        }
        res.info[blockKey] = { pos: event.pos, texture: event.texture };
      } else if (event.type === "remove" && res.info[blockKey]) {
        delete res.info[blockKey];
        res.infoList.splice(res.infoList.indexOf(blockKey), 1);
      }
    });
  }

  const [ac, testor] = initialRenders(fillRes, chunks);
  postMessage({ worldFiller: { chunkKeys: chunks, ac, testor } });
}

function initialRenders(fillRes, chunkKeys) {
  const t = 0.5;

  const blocks = {};
  chunkKeys.forEach((ck) => {
    Object.assign(blocks, fillRes[ck].info);
  });

  chunkKeys.forEach((ck) => {
    const chunkBlocks = {
      keys: fillRes[ck].infoList,
      count: fillRes[ck].infoList.length,
    };

    const draw = packDrawArrays(genFaceArrays(t, blocks, chunkBlocks));

    fillRes[ck] = {
      keys: fillRes[ck].infoList,
      count: fillRes[ck].infoList.length,
      visible: false,
      draw: { rere: false, ...draw },
    };
  });
  return [blocks, fillRes];
}
