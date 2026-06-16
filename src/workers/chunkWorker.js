import { createNoise2D, createNoise3D } from "simplex-noise";
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
  // cave carve uses three 3D fields (see isCave): A+B intersect into thin
  // spaghetti tunnels, C carves big open cheese caverns
  worldSet.caveNoiseA = createNoise3D(alea(worldSet.seed + "-caveA"));
  worldSet.caveNoiseB = createNoise3D(alea(worldSet.seed + "-caveB"));
  worldSet.caveNoiseC = createNoise3D(alea(worldSet.seed + "-caveC"));
  // independent low-frequency maps pick biomes without disturbing the height
  // field, plus an extra octave for richer relief
  worldSet.contNoise = createNoise2D(alea(worldSet.seed + "-cont")); // land/ocean
  worldSet.tempNoise = createNoise2D(alea(worldSet.seed + "-temp")); // desert/plains
  worldSet.detailNoise = createNoise2D(alea(worldSet.seed + "-detail"));
  // low-frequency mask that decides, per column, whether caves are allowed to
  // breach the surface skin (see entranceCapDepth) -- so openings cluster into
  // a few natural regions instead of pocking the whole map
  worldSet.entranceNoise = createNoise2D(alea(worldSet.seed + "-entrance"));
  worldSet.seedNum = String(worldSet.seed)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0) * 31, 7);

  postMessage({ init: true });
}

// Caves come in two flavours, like modern Minecraft:
//
//  - "Cheese" caverns: a single 3D noise field carves out whole volumes
//    wherever it rises past a threshold. Because it removes a 3D region (not
//    the intersection of two surfaces) these are big, open rooms you can
//    actually walk around in.
//  - "Spaghetti" tunnels: where two other 3D fields are both near zero their
//    iso-surfaces intersect along thin winding channels, which link the
//    cheese rooms together.
//
// Everything is a pure function of (x,y,z), so caves stay seamless across
// chunk borders and workers with no worm-tracing or cross-chunk bookkeeping.

// Cheese caverns -- the open space. Lower threshold -> more/larger rooms.
const CHEESE_SCALE = 1 / 22; // larger divisor -> bigger rooms
const CHEESE_THRESHOLD = 0.4; // smaller -> more open volume carved out

// Spaghetti tunnels -- thin passages that connect the rooms.
const TUNNEL_SCALE = 1 / 40; // larger divisor -> wider, more spread-out tunnels
const TUNNEL_THRESHOLD = 0.06; // larger -> wider/more tunnels

// Surface cave entrances. By default columnBlocks preserves the top
// SURFACE_CAP blocks so caves never breach the surface. In rare regions
// picked by entranceNoise we lift that cap toward 0 so caves that happen to
// reach the surface punch a natural, walkable opening -- making caves
// discoverable without digging straight down. Spawn stays protected.
const SURFACE_CAP = 4; // blocks of surface skin kept solid where no entrance
const ENTRANCE_SCALE = 1 / 130; // larger divisor -> bigger, rarer entrance zones
const ENTRANCE_THRESHOLD = 0.66; // higher -> fewer columns eligible for openings
const ENTRANCE_FEATHER = 0.16; // noise band over which the cap ramps 4 -> 0
const SPAWN_SAFE_RADIUS = 32; // no entrances within this many blocks of origin
const SPAWN_SAFE_FEATHER = 24; // entrances ramp back in over this outer band

// How many surface blocks to keep solid at column (x,z). Normally SURFACE_CAP;
// drops toward 0 inside entrance regions (and only well away from spawn) so
// caves there can open to the sky.
function entranceCapDepth(x, z) {
  const m = (worldSet.entranceNoise(x * ENTRANCE_SCALE, z * ENTRANCE_SCALE) + 1) / 2;
  const inRegion = smoothstep(
    ENTRANCE_THRESHOLD,
    ENTRANCE_THRESHOLD + ENTRANCE_FEATHER,
    m,
  );
  const dist = Math.hypot(x, z);
  const awayFromSpawn = smoothstep(
    SPAWN_SAFE_RADIUS,
    SPAWN_SAFE_RADIUS + SPAWN_SAFE_FEATHER,
    dist,
  );
  const strength = inRegion * awayFromSpawn; // 0 = capped, 1 = fully open
  return Math.round(SURFACE_CAP * (1 - strength));
}

function isCave(x, y, z) {
  // open cheese cavern
  const c = worldSet.caveNoiseC(
    x * CHEESE_SCALE,
    y * CHEESE_SCALE,
    z * CHEESE_SCALE
  );
  if (c > CHEESE_THRESHOLD) {
    return true;
  }
  // spaghetti tunnel: both fields near zero at the same point
  const a = worldSet.caveNoiseA(
    x * TUNNEL_SCALE,
    y * TUNNEL_SCALE,
    z * TUNNEL_SCALE
  );
  if (Math.abs(a) > TUNNEL_THRESHOLD) {
    return false;
  }
  const b = worldSet.caveNoiseB(
    x * TUNNEL_SCALE,
    y * TUNNEL_SCALE,
    z * TUNNEL_SCALE
  );
  return Math.abs(b) <= TUNNEL_THRESHOLD;
}

const OCEAN = "ocean";
const DESERT = "desert";
const PLAINS = "plains";

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// Smoothly-varying biome map on large scales. Continentalness picks ocean vs
// land; on land, temperature picks desert vs plains. Used only for surface
// material + tree placement -- terrain *height* is driven continuously by
// continentalness (see surfaceHeight) so biome edges never form cliffs.
function biomeAt(x, z) {
  const cont = (worldSet.contNoise(x / 380, z / 380) + 1) / 2;
  if (cont < 0.4) {
    return OCEAN;
  }
  const temp = (worldSet.tempNoise(x / 260, z / 260) + 1) / 2;
  if (temp > 0.62) {
    return DESERT;
  }
  return PLAINS;
}

// Deterministic per-position hash in [0,1) -- trees and cacti must land on the
// same columns no matter which chunk (or which worker) generates them. The
// shifts must be unsigned (>>>): a signed >> sign-extends, which forces the
// result's top bit to 0 and caps the output at 0.5 (so e.g. floor(hash01*3)
// could never reach 2 and the rare "big tree" branch never fired).
function hash01(x, z, salt) {
  let h = (x | 0) * 374761393 + (z | 0) * 668265263 + salt * 1274126177;
  h = (h ^ (h >>> 13)) * 1103515245;
  h = h ^ (h >>> 16);
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

// Terrain column height. Land elevation mixes three octaves for more depth
// and variation than the original two; continentalness then lerps the whole
// column down toward an ocean floor as we move out to sea, giving smooth
// coastlines and proper deep-water ocean biomes.
const OCEAN_FLOOR = -6; // sits at minY+1 (bedrock floor is minY = -7)
function surfaceHeight(x, z) {
  const n = worldSet.genNoise2D;
  const d = worldSet.detailNoise;
  const hf = worldSet.heightFactor;

  const broad = (n(x / 140, z / 140) + 1) / 2; // big landforms
  const hills = (n(x / 55, z / 55) + 1) / 2; // hills
  const detail = (d(x / 22, z / 22) + 1) / 2; // bumps
  const landElev = broad * hf * 1.3 + hills * 5 + detail * 2.5 - 2;

  // 0 = deep ocean, 1 = full inland; the band between is the coast
  const cont = (worldSet.contNoise(x / 380, z / 380) + 1) / 2;
  const cf = smoothstep(0.3, 0.55, cont);
  const elev = OCEAN_FLOOR + (landElev - OCEAN_FLOOR) * cf;

  return Math.floor(elev);
}

function columnBlocks(x, z, info, infoList) {
  const { minY, waterLevel } = worldSet;
  let h = surfaceHeight(x, z);
  if (h < minY + 1) {
    h = minY + 1; // never leave a void column under deep ocean
  }
  const biome = biomeAt(x, z);
  // sand surface in deserts, on ocean/lake floors, and on beaches near water
  const sandy = biome === DESERT || biome === OCEAN || h <= waterLevel + 1;

  // how much surface skin stays solid: full cap underwater/on beaches (keeps
  // ocean floors intact), but reduced inland inside rare entrance regions so
  // caves can break the surface there
  const cap =
    h > waterLevel + 1 ? entranceCapDepth(x, z) : SURFACE_CAP;

  for (let y = minY; y <= h; y++) {
    // carve caves out of the stone interior: skip the preserved surface skin
    // (cap blocks, normally 4) so terrain stays capped, and keep bedrock + one
    // block above it as a solid floor so caves never bottom out into the void
    if (y > minY + 1 && y <= h - cap && isCave(x, y, z)) {
      continue;
    }
    let texture;
    if (y === minY) {
      texture = "bedrock";
    } else if (y === h) {
      texture = sandy ? "sand" : "grass";
    } else if (y >= h - 3) {
      texture = sandy ? "sand" : "dirt";
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
  if (biomeAt(x, z) !== PLAINS) {
    return null; // trees only grow in the plains biome (not desert/ocean)
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

const CACTUS_CHANCE = 0.004; // per desert column -- deliberately very sparse

// Returns the cactus rooted at column (x,z), or null. Deterministic. Cacti
// are a single block-wide column (no overhang), so unlike trees they never
// spill into neighbouring chunks and need no margin scan.
function cactusAt(x, z) {
  if (biomeAt(x, z) !== DESERT) {
    return null; // cacti grow only in deserts
  }
  if (hash01(x, z, worldSet.seedNum + 7) >= CACTUS_CHANCE) {
    return null;
  }
  const h = surfaceHeight(x, z);
  if (h <= worldSet.waterLevel + 1) {
    return null; // not on damp sand near water
  }
  const trunkH = 1 + Math.floor(hash01(x, z, worldSet.seedNum + 8) * 3); // 1-3
  return { x, z, baseY: h + 1, topY: h + trunkH };
}

// Writes a cactus's blocks. Caller only invokes this for columns inside the
// chunk, so no bounds check is needed.
function placeCactus(cactus, info, infoList) {
  for (let y = cactus.baseY; y <= cactus.topY; y++) {
    const key = makeKey(cactus.x, y, cactus.z);
    if (info[key]) {
      continue; // never overwrite terrain
    }
    infoList.push(key);
    info[key] = { pos: [cactus.x, y, cactus.z], texture: "cactus" };
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

    // cacti: single-column, no overhang, so only the chunk's own columns
    for (let x = x0; x < x0 + cS; x++) {
      for (let z = z0; z < z0 + cS; z++) {
        const cactus = cactusAt(x, z);
        if (cactus) {
          placeCactus(cactus, info, infoList);
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
