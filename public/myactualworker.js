const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));

onmessage = (e) => {
  const { t, blocks,chunkblocks } = e.data;
  let count = chunkblocks.count
//   const startTime = new Date().getTime();
// let res=new Array(num).fill(0)
//   const fibNum = fib(num);
    let [vertices, uvs, normals, faceindexmap] = genFaceArrays(t, blocks,chunkblocks)
  postMessage({
    vertices, uvs, normals, faceindexmap, count
    // time: new Date().getTime() - startTime,
  });
};

const AMTmap = {
	'dirt': [3,16],
	'wood': [5,16],
	'grass': [5,3],
	'sand': [3,15],
	'wood': [5,16],
	'ground': [8,11],
	'barktop': [5,15],
	'log': [5,15],
	'bedrock': [2,15],
	'glass': [3,5]
}

function makeKey(x, y, z) {
    return x + "." + y + "." + z;
  }

  function makeFaceIndexMapObject(cen, nx, ny, nz) {
    return {
      remove: cen,
      add: {
        key: makeKey(nx, ny, nz),
        pos: [nx, ny, nz],
      },
    };
  }

function genFaceArrays(t, blocks,chunkblocks) {
    let t2 = 2 * t;
    let vertices = [];
    let uvs = [];
    let normals = [];

    let uvSize = 1 / 2 / 2 / 2 / 2;
    let faceindexmap = {
      // 0:{
      //   remove:'1.0.1',
      //   add:{
      //     key: '1.2.1',
      //     pos: [x, y, z]
      //   },
      // }
    };
    let facemapcount = 0;
    // console.log('geuss not',currentblocks)
    chunkblocks.keys.forEach((cen) => {
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
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx, ny, nz + 1);
        facemapcount += 2;
      }
      // //back
      if (!blocks[makeKey(nx, ny, nz - t2)]) {
        vertices.push(...c[6], ...c[7], ...c[5]);
        vertices.push(...c[5], ...c[7], ...c[8]);
        normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "back\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx, ny, nz - 1);
        facemapcount += 2;
      }
      // //left
      if (!blocks[makeKey(nx - t2, ny, nz)]) {
        vertices.push(...c[2], ...c[3], ...c[6]);
        vertices.push(...c[6], ...c[3], ...c[7]);
        normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "left\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx - 1, ny, nz);
        facemapcount += 2;
      }
      // //right
      if (!blocks[makeKey(nx + t2, ny, nz)]) {
        vertices.push(...c[5], ...c[8], ...c[1]);
        vertices.push(...c[1], ...c[8], ...c[4]);
        normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "right\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx + 1, ny, nz);
        facemapcount += 2;
      }
      // //top
      if (!blocks[makeKey(nx, ny + t2, nz)]) {
        vertices.push(...c[4], ...c[8], ...c[3]);
        vertices.push(...c[3], ...c[8], ...c[7]);
        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "top\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx, ny + 1, nz);
        facemapcount += 2;
      }
      // //bot
      if (!blocks[makeKey(nx, ny - t2, nz)]) {
        vertices.push(...c[5], ...c[1], ...c[6]);
        vertices.push(...c[6], ...c[1], ...c[2]);
        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "bot\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx, ny - 1, nz);
        facemapcount += 2;
      }

      blocks[cen].showface = showfaces;
    });

    // cubeFaceIndexesREF.current = faceindexmap;

    return [vertices, uvs, normals, faceindexmap];
  }