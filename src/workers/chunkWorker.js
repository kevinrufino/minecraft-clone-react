import { createNoise2D } from "simplex-noise";
import alea from "alea";

let worldSet = {};

onmessage = (e) => {
  if (e.data.init) {
    // console.log('[FROM WORKER]','INIT:',e.data)
    // console.log('[FROM WORKER]','INIT:')
    initializeWorker(e.data.init);
  } else {
    // console.log('[FROM WORKER]','regular flow:',e.data)
    // console.log('[FROM WORKER]','regular flow',e.data.chunkNumber)
    regularFlow(e.data);
  }
};

function initializeWorker(init) {
  worldSet = { ...init.worldSettings };
  worldSet["genNoise2D"] = createNoise2D(alea(worldSet.seed));

  postMessage({ init: true });
}

function regularFlow(data) {
  let { t, blocks, chunkBlocks, chunkNumber, ftBool } = data;

  let count = chunkBlocks.count;

  if (!ftBool) {
    let [info, infoList] = buildChunkForTheFirstTime(16, chunkNumber);

    chunkBlocks.keys = infoList;
    chunkBlocks.count = infoList.length;
    blocks = { ...blocks, ...info };
  }

  let [vertices, uvs, normals, faceIndexMap] = genFaceArrays(t, blocks, chunkBlocks);
  postMessage({
    vertices,
    uvs,
    normals,
    faceIndexMap,
    count,
    chunkNumber,
    blocksOfChunk: chunkBlocks,
    forRefAll: ftBool ? null : blocks,
  });
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

  // console.log('[FROM WORKER]chunkBlocks',chunkBlocks)
  // console.log('[FROM WORKER]chunkBlocks',chunkBlocks)
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

function buildChunkForTheFirstTime(worldCubeSize, chunkNumber) {
  let ws = worldCubeSize;
  let cnX = Math.floor(chunkNumber / ws);
  let cnZ = (chunkNumber / worldCubeSize - cnX) * ws;

  // const prng = alea("1000");
  const noise2D = worldSet["genNoise2D"];
  let info = {};
  let infoList = [];
  // let xs = worldCubeSize**2;
  let xs = ws; // world chunk size
  let ys = 1;
  let zs = xs;
  let heightFactor = worldSet["heightFactor"];
  let depth = 0;
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
  // console.log('myinfo',info)

  // REF_ALLCUBES.current = { ...REF_ALLCUBES.current, ...info }; // i need to add the new blocks to all cubes ref
  // chunks.current[chunkNumber].keys = infoList;
  // chunks.current[chunkNumber].count = infoList.length;
  return [info, infoList];
}

function makeNoise() {
  let perlin = {
    rand_vect: function () {
      let theta = this.myRand() * 2 * Math.PI;
      return { x: Math.cos(theta), y: Math.sin(theta) };
    },
    dot_prod_grid: function (x, y, vx, vy) {
      let g_vect;
      let d_vect = { x: x - vx, y: y - vy };
      if (this.gradients[[vx, vy]]) {
        g_vect = this.gradients[[vx, vy]];
      } else {
        g_vect = this.rand_vect();
        this.gradients[[vx, vy]] = g_vect;
      }
      return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    },
    smootherstep: function (x) {
      return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
    },
    interp: function (x, a, b) {
      return a + this.smootherstep(x) * (b - a);
    },
    seed: function (v) {
      this.gradients = {};
      this.memory = {};
      this.seedlastval = 0;
      this.myRand = this.pseudoRandom(v);
    },
    get: function (x, y) {
      if (this.memory.hasOwnProperty([x, y])) return this.memory[[x, y]];
      let xf = Math.floor(x);
      let yf = Math.floor(y);
      //interpolate
      let tl = this.dot_prod_grid(x, y, xf, yf);
      let tr = this.dot_prod_grid(x, y, xf + 1, yf);
      let bl = this.dot_prod_grid(x, y, xf, yf + 1);
      let br = this.dot_prod_grid(x, y, xf + 1, yf + 1);
      let xt = this.interp(x - xf, tl, tr);
      let xb = this.interp(x - xf, bl, br);
      let v = this.interp(y - yf, xt, xb);
      this.memory[[x, y]] = v;
      return v;
    },
    pseudoRandom: function (seed) {
      let res = ("" + seed)
        .substring(0, 20)
        .split("")
        .reduce((prev, s, idx) => {
          prev += "" + s.charCodeAt(0) + idx;
          return prev;
        }, "");
      let value = Number(res);
      value = (value * 16807) % 2147483647;
      this.seedlastval = value;

      return () => {
        let prevValue = this.seedlastval;
        this.seedlastval = (this.seedlastval * 16807) % 2147483647;
        return prevValue;
      };
    },
  };
  perlin.seed("seed");

  return perlin;
}
