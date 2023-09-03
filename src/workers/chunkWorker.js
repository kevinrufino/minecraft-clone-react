import { createNoise2D } from "simplex-noise";
import alea from "alea";

let worldSet = {};

onmessage = (e) => {
  if (e.data.init) {
    // console.log('[FROM WORKER] - INIT')
    initializeWorker(e.data.init);
  } else if (e.data.fillWorld) {
    // console.log(`[FROM WORKER-${worldSet.w_ind}] - chunkgroup`,e.data.fillWorld)
    initialFill(e.data.fillWorld);
  } else {
    regularFlow(e.data);
  }
};

function initializeWorker(init) {
  worldSet = { ...init.worldSettings };
  worldSet["genNoise2D"] = createNoise2D(alea(worldSet.seed));

  postMessage({ init: true });
}

function regularFlow(data) {
  let { t, blocks, chunkBlocks, chunkNumber } = data;

  let [vertices, uvs, normals, faceIndexMap] = genFaceArrays(t, blocks, chunkBlocks);
  vertices = new Float32Array(vertices);
  uvs = new Float32Array(uvs);
  normals = new Float32Array(normals);
  let singleChunkResponse = {
    vertices,
    uvs,
    normals,
    faceIndexMap,
    count: chunkBlocks["count"],
    chunkNumber,
    blocksOfChunk: chunkBlocks,
  };
  postMessage(singleChunkResponse);
}

const AMTmap = {
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
const AMTmapkeys = Object.keys(AMTmap);

function makeKey(x, y, z) {
  return x + "." + y + "." + z;
}

function makefaceIndexMapObject(cen, nx, ny, nz) {
  return {
    remove: cen,
    add: {
      key: makeKey(nx, ny, nz),
      pos: [nx, ny, nz],
    },
  };
}

function genFaceArrays(t, blocks, chunkBlocks) {
  let t2 = 2 * t;
  let vertices = [];
  let uvs = [];
  let normals = [];

  let uvSize = 1 / 2 / 2 / 2 / 2;
  let faceIndexMap = {
    // 0:{
    //   remove:'1.0.1',
    //   add:{
    //     key: '1.2.1',
    //     pos: [x, y, z]
    //   },
    // }
  };
  let facemapcount = 0;
  chunkBlocks.keys.forEach((cen) => {
    let [nx, ny, nz] = cen.split(".");
    let [x, y, z] = blocks[cen].pos;
    let showfaces = [false, false, false, false, false, false];
    let currtexture = blocks[cen].texture;
    let uvL = (AMTmap[currtexture][0] - 1) * uvSize;
    let uvB = (AMTmap[currtexture][1] - 1) * uvSize;

    let onefaceuv = [
      //uv means UxV meaning (u,v) meaning u is the x cordinate v is the y
      uvL + uvSize,
      uvB + 0,
      uvL + uvSize,
      uvB + uvSize,
      uvL + 0,
      uvB + 0,
      uvL + 0,
      uvB + 0,
      uvL + uvSize,
      uvB + uvSize,
      uvL + 0,
      uvB + uvSize,
    ];

    nx = Number(nx);
    ny = Number(ny);
    nz = Number(nz);

    let c = {}; // c = corners
    c[1] = [x + t, y - t, z + t];
    c[2] = [x - t, y - t, z + t];
    c[3] = [x - t, y + t, z + t];
    c[4] = [x + t, y + t, z + t];
    c[5] = [x + t, y - t, z - t];
    c[6] = [x - t, y - t, z - t];
    c[7] = [x - t, y + t, z - t];
    c[8] = [x + t, y + t, z - t];

    let dbstr = "";

    // //front
    if (!blocks[makeKey(nx, ny, nz + t2)]) {
      showfaces[0] = true;
      vertices.push(...c[1], ...c[4], ...c[2]);
      vertices.push(...c[2], ...c[4], ...c[3]);
      normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
      uvs.push(...onefaceuv);
      dbstr = dbstr + "front\n";
      faceIndexMap[facemapcount] = makefaceIndexMapObject(cen, nx, ny, nz + 1);
      facemapcount += 2;
    }
    // //back
    if (!blocks[makeKey(nx, ny, nz - t2)]) {
      vertices.push(...c[6], ...c[7], ...c[5]);
      vertices.push(...c[5], ...c[7], ...c[8]);
      normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
      uvs.push(...onefaceuv);
      dbstr = dbstr + "back\n";
      faceIndexMap[facemapcount] = makefaceIndexMapObject(cen, nx, ny, nz - 1);
      facemapcount += 2;
    }
    // //left
    if (!blocks[makeKey(nx - t2, ny, nz)]) {
      vertices.push(...c[2], ...c[3], ...c[6]);
      vertices.push(...c[6], ...c[3], ...c[7]);
      normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
      uvs.push(...onefaceuv);
      dbstr = dbstr + "left\n";
      faceIndexMap[facemapcount] = makefaceIndexMapObject(cen, nx - 1, ny, nz);
      facemapcount += 2;
    }
    // //right
    if (!blocks[makeKey(nx + t2, ny, nz)]) {
      vertices.push(...c[5], ...c[8], ...c[1]);
      vertices.push(...c[1], ...c[8], ...c[4]);
      normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
      uvs.push(...onefaceuv);
      dbstr = dbstr + "right\n";
      faceIndexMap[facemapcount] = makefaceIndexMapObject(cen, nx + 1, ny, nz);
      facemapcount += 2;
    }
    // //top
    if (!blocks[makeKey(nx, ny + t2, nz)]) {
      vertices.push(...c[4], ...c[8], ...c[3]);
      vertices.push(...c[3], ...c[8], ...c[7]);
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      uvs.push(...onefaceuv);
      dbstr = dbstr + "top\n";
      faceIndexMap[facemapcount] = makefaceIndexMapObject(cen, nx, ny + 1, nz);
      facemapcount += 2;
    }
    // //bot
    if (!blocks[makeKey(nx, ny - t2, nz)]) {
      vertices.push(...c[5], ...c[1], ...c[6]);
      vertices.push(...c[6], ...c[1], ...c[2]);
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      uvs.push(...onefaceuv);
      dbstr = dbstr + "bot\n";
      faceIndexMap[facemapcount] = makefaceIndexMapObject(cen, nx, ny - 1, nz);
      facemapcount += 2;
    }

    blocks[cen].showface = showfaces;
  });

  return [vertices, uvs, normals, faceIndexMap];
}

function initialFill(chunkNumbers) {
  let fillRes = {};
  chunkNumbers.forEach((chunkNumber) => {
    let ws = 16;
    let cnX = Math.floor(chunkNumber / ws);
    let cnZ = (chunkNumber / ws - cnX) * ws;
    const noise2D = worldSet["genNoise2D"];
    let info = {};
    let infoList = [];
    let ys = 1;
    let heightFactor = worldSet["heightFactor"];
    let depth = worldSet["depth"];
    let key = "";

    let ty = 0; //test y for noise

    let difflimit = AMTmapkeys.length;

    for (let x = 16 * cnX; x < 16 * cnX + 16; x++) {
      for (let y = -1 * Math.abs(depth); y < ys; y++) {
        for (let z = 16 * cnZ; z < 16 * cnZ + 16; z++) {
          ty = worldSet.showFlatWorld ? y : Math.floor(((noise2D(x / 100, z / 100) + 1) * heightFactor) / 2) + y;

          key = makeKey(x, ty, z);
          let texture = "";
          if (worldSet["useHeightTextures"]) {
            texture = AMTmapkeys[ty % difflimit];
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
  let [ac, testor] = initialrendors(fillRes, chunkNumbers);
  let worldFiller = { chunkNumbers, ac, testor };
  // console.log(`[FROM WORKER:${worldSet.w_ind}]- before post`, worldFiller);
  postMessage({ worldFiller });
}

function initialrendors(fillRes, chunkNumbers) {
  let t = 0.5;

  let blocks = {};
  chunkNumbers.forEach((cn) => {
    blocks = { ...blocks, ...fillRes[cn].info };
  });

  chunkNumbers.forEach((cn, myind) => {
    let chunkBlocks = {
      keys: fillRes[cn].infoList,
      count: fillRes[cn].infoList.length,
    };

    let [vertices, uvs, normals, faceIndexMap] = genFaceArrays(t, blocks, chunkBlocks, cn);

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
      faceIndexMap,
    };
  });
  return [blocks, fillRes];
}