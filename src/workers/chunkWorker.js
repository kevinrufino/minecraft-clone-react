import { createNoise2D } from "simplex-noise";
import alea from "alea";
import { makeKey } from "../world/keys";
import { AMTmapkeys } from "../world/atlas";
import { genFaceArrays } from "../world/meshGen";

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

// Rebuilds a single chunk's mesh after a user placed or removed a block.
function regularFlow(data) {
  let { t, blocks, chunkBlocks, chunkNumber } = data;

  let [vertices, uvs, normals] = genFaceArrays(t, blocks, chunkBlocks);
  vertices = new Float32Array(vertices);
  uvs = new Float32Array(uvs);
  normals = new Float32Array(normals);
  const singleChunkResponse = {
    vertices,
    uvs,
    normals,
    count: chunkBlocks.count,
    chunkNumber,
    blocksOfChunk: chunkBlocks,
  };
  postMessage({ regFlow: singleChunkResponse });
}

// Generates terrain blocks for a batch of chunks, then meshes them.
function initialFill(chunkNumbers) {
  const fillRes = {};
  chunkNumbers.forEach((chunkNumber) => {
    const cS = worldSet.chunkSize;
    const wS = worldSet.worldSize;
    const cnX = Math.floor(chunkNumber / wS);
    const cnZ = chunkNumber % wS;
    const noise2D = worldSet.genNoise2D;
    const info = {};
    const infoList = [];
    const ys = 1;
    const heightFactor = worldSet.heightFactor;
    const depth = worldSet.depth;
    const difflimit = AMTmapkeys.length;

    for (let x = cS * cnX; x < cS * cnX + cS; x++) {
      for (let y = -1 * Math.abs(depth); y < ys; y++) {
        for (let z = cS * cnZ; z < cS * cnZ + cS; z++) {
          const ty = worldSet.showFlatWorld
            ? y
            : Math.floor(((noise2D(x / 100, z / 100) + 1) * heightFactor) / 2) +
              y;

          const key = makeKey(x, ty, z);
          let texture = "";
          if (worldSet.useHeightTextures) {
            texture = AMTmapkeys[Math.abs(ty) % difflimit];
          } else {
            texture = Math.abs(x - z) < 16 ? "wood" : "grass";
          }
          infoList.push(key);
          info[key] = {
            pos: [x, ty, z],
            texture,
          };
        }
      }
    }
    fillRes[chunkNumber] = { info, infoList };
  });
  const [ac, testor] = initialRenders(fillRes, chunkNumbers);
  postMessage({ worldFiller: { chunkNumbers, ac, testor } });
}

function initialRenders(fillRes, chunkNumbers) {
  const t = 0.5;

  let blocks = {};
  chunkNumbers.forEach((cn) => {
    Object.assign(blocks, fillRes[cn].info);
  });

  chunkNumbers.forEach((cn) => {
    const chunkBlocks = {
      keys: fillRes[cn].infoList,
      count: fillRes[cn].infoList.length,
    };

    let [vertices, uvs, normals] = genFaceArrays(t, blocks, chunkBlocks);
    vertices = new Float32Array(vertices);
    uvs = new Float32Array(uvs);
    normals = new Float32Array(normals);

    fillRes[cn] = {
      keys: fillRes[cn].infoList,
      count: fillRes[cn].infoList.length,
      visible: false,
      draw: {
        rere: false,
        vertices,
        uvs,
        normals,
      },
    };
  });
  return [blocks, fillRes];
}
