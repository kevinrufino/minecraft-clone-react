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

const TREE_CHANCE = 0.005;
const TREE_MARGIN = 3; // max canopy radius -- trees this close outside a chunk spill into it

// Returns the tree rooted at column (x,z), or null. Deterministic.
function treeAt(x, z) {
  if (hash01(x, z, worldSet.seedNum) >= TREE_CHANCE) {
    return null;
  }
  const h = surfaceHeight(x, z);
  if (h <= worldSet.waterLevel + 1) {
    return null; // no trees on beaches or underwater
  }

  // three species, each with per-tree height variation
  const species = hash01(x, z, worldSet.seedNum + 2);
  let trunkH, radius, tall;
  if (species < 0.25) {
    // shrubby sapling: short trunk, tight canopy
    trunkH = 3 + Math.floor(hash01(x, z, worldSet.seedNum + 1) * 2); // 3-4
    radius = 1;
    tall = false;
  } else if (species < 0.85) {
    // classic oak
    trunkH = 4 + Math.floor(hash01(x, z, worldSet.seedNum + 1) * 3); // 4-6
    radius = 2;
    tall = hash01(x, z, worldSet.seedNum + 3) < 0.3; // some get a taller crown
  } else {
    // big old tree
    trunkH = 7 + Math.floor(hash01(x, z, worldSet.seedNum + 1) * 3); // 7-9
    radius = 3;
    tall = true;
  }
  return { x, z, baseY: h + 1, topY: h + trunkH, radius, tall };
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

  // canopy: wide layers around the trunk top, then a narrower cap
  const r = tree.radius;
  const wideFrom = tree.topY - (tree.tall ? 2 : 1);
  for (let y = wideFrom; y <= tree.topY; y++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) === r && Math.abs(dz) === r && r > 1) {
          continue; // clip corners
        }
        put(tree.x + dx, y, tree.z + dz, "leaves");
      }
    }
  }
  const capR = Math.max(1, r - 1);
  for (let dx = -capR; dx <= capR; dx++) {
    for (let dz = -capR; dz <= capR; dz++) {
      if (Math.abs(dx) === capR && Math.abs(dz) === capR && capR > 1) {
        continue;
      }
      put(tree.x + dx, tree.topY + 1, tree.z + dz, "leaves");
    }
  }
  put(tree.x, tree.topY + 2, tree.z, "leaves");
  if (tree.tall) {
    put(tree.x + 1, tree.topY + 2, tree.z, "leaves");
    put(tree.x, tree.topY + 2, tree.z + 1, "leaves");
  }

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

    // a 1-block ring of neighbor terrain, used only for face culling so
    // chunk-border faces don't render (terrain is deterministic, so this
    // matches whatever the neighbor chunk actually contains)
    const marginInfo = {};
    const marginList = [];
    for (let x = x0 - 1; x < x0 + cS + 1; x++) {
      for (let z = z0 - 1; z < z0 + cS + 1; z++) {
        if (x >= x0 && x < x0 + cS && z >= z0 && z < z0 + cS) {
          continue;
        }
        columnBlocks(x, z, marginInfo, marginList);
      }
    }

    fillRes[ck] = { info, infoList, marginInfo, x0, z0 };
  });

  // overlay player edits (adds/removes recorded against generated terrain)
  if (edits) {
    Object.entries(edits).forEach(([blockKey, event]) => {
      const [ex, , ez] = event.pos;
      chunks.forEach((ck) => {
        const res = fillRes[ck];
        const inChunk =
          ex >= res.x0 && ex < res.x0 + cS && ez >= res.z0 && ez < res.z0 + cS;
        const inMargin =
          !inChunk &&
          ex >= res.x0 - 1 &&
          ex < res.x0 + cS + 1 &&
          ez >= res.z0 - 1 &&
          ez < res.z0 + cS + 1;

        if (inChunk) {
          if (event.type === "add") {
            if (!res.info[blockKey]) {
              res.infoList.push(blockKey);
            }
            res.info[blockKey] = { pos: event.pos, texture: event.texture };
          } else if (event.type === "remove" && res.info[blockKey]) {
            delete res.info[blockKey];
            res.infoList.splice(res.infoList.indexOf(blockKey), 1);
          }
        } else if (inMargin) {
          // keep the culling ring in sync with edited neighbor terrain
          if (event.type === "add") {
            res.marginInfo[blockKey] = {
              pos: event.pos,
              texture: event.texture,
            };
          } else if (event.type === "remove") {
            delete res.marginInfo[blockKey];
          }
        }
      });
    });
  }

  const [ac, testor] = initialRenders(fillRes, chunks);
  postMessage({ worldFiller: { chunkKeys: chunks, ac, testor } });
}

function initialRenders(fillRes, chunkKeys) {
  const t = 0.5;

  const allBlocks = {};
  chunkKeys.forEach((ck) => {
    Object.assign(allBlocks, fillRes[ck].info);
  });

  chunkKeys.forEach((ck) => {
    const chunkBlocks = {
      keys: fillRes[ck].infoList,
      count: fillRes[ck].infoList.length,
    };

    // mesh against own blocks + the deterministic neighbor ring so faces on
    // chunk borders cull correctly no matter which batch the neighbor is in
    const cullBlocks = { ...fillRes[ck].marginInfo, ...fillRes[ck].info };
    const draw = packDrawArrays(genFaceArrays(t, cullBlocks, chunkBlocks));

    fillRes[ck] = {
      keys: fillRes[ck].infoList,
      count: fillRes[ck].infoList.length,
      visible: false,
      draw: { rere: false, ...draw },
    };
  });
  return [allBlocks, fillRes];
}
