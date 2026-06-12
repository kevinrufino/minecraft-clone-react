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

  postMessage({ init: true });
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

// Generates terrain blocks for a batch of chunks, applies player edits,
// then meshes them.
function initialFill({ chunks, edits }) {
  const fillRes = {};
  const cS = worldSet.chunkSize;

  chunks.forEach((ck) => {
    const { cx, cz } = parseChunkKey(ck);
    const info = {};
    const infoList = [];

    for (let x = cS * cx; x < cS * cx + cS; x++) {
      for (let z = cS * cz; z < cS * cz + cS; z++) {
        columnBlocks(x, z, info, infoList);
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
