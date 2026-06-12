import { makeKey } from "./keys";
import { AMTmap, ATLAS_UV_SIZE } from "./atlas";

// Builds flat vertex/uv/normal arrays for every exposed face of a chunk.
// `t` is the block half-thickness, `blocks` must contain the chunk's blocks
// plus their neighbors so faces shared with adjacent chunks get culled.
export function genFaceArrays(t, blocks, chunkBlocks) {
  const t2 = 2 * t;
  const vertices = [];
  const uvs = [];
  const normals = [];

  chunkBlocks.keys.forEach((cen) => {
    let [nx, ny, nz] = cen.split(".");
    const [x, y, z] = blocks[cen].pos;

    const currtexture = blocks[cen].texture;
    const uvL = (AMTmap[currtexture][0] - 1) * ATLAS_UV_SIZE;
    const uvB = (AMTmap[currtexture][1] - 1) * ATLAS_UV_SIZE;
    const onefaceuv = [
      //uv means UxV meaning (u,v) meaning u is the x cordinate v is the y
      uvL + ATLAS_UV_SIZE,
      uvB + 0,
      uvL + ATLAS_UV_SIZE,
      uvB + ATLAS_UV_SIZE,
      uvL + 0,
      uvB + 0,
      uvL + 0,
      uvB + 0,
      uvL + ATLAS_UV_SIZE,
      uvB + ATLAS_UV_SIZE,
      uvL + 0,
      uvB + ATLAS_UV_SIZE,
    ];

    nx = Number(nx);
    ny = Number(ny);
    nz = Number(nz);

    const c = {}; // c = corners
    c[1] = [x + t, y - t, z + t];
    c[2] = [x - t, y - t, z + t];
    c[3] = [x - t, y + t, z + t];
    c[4] = [x + t, y + t, z + t];
    c[5] = [x + t, y - t, z - t];
    c[6] = [x - t, y - t, z - t];
    c[7] = [x - t, y + t, z - t];
    c[8] = [x + t, y + t, z - t];

    function pushFace(corners, normal) {
      vertices.push(...corners[0], ...corners[1], ...corners[2]);
      vertices.push(...corners[3], ...corners[4], ...corners[5]);
      for (let i = 0; i < 6; i++) {
        normals.push(...normal);
      }
      uvs.push(...onefaceuv);
    }

    // front (+z)
    if (!blocks[makeKey(nx, ny, nz + t2)]) {
      pushFace([c[1], c[4], c[2], c[2], c[4], c[3]], [0, 0, 1]);
    }
    // back (-z)
    if (!blocks[makeKey(nx, ny, nz - t2)]) {
      pushFace([c[6], c[7], c[5], c[5], c[7], c[8]], [0, 0, -1]);
    }
    // left (-x)
    if (!blocks[makeKey(nx - t2, ny, nz)]) {
      pushFace([c[2], c[3], c[6], c[6], c[3], c[7]], [-1, 0, 0]);
    }
    // right (+x)
    if (!blocks[makeKey(nx + t2, ny, nz)]) {
      pushFace([c[5], c[8], c[1], c[1], c[8], c[4]], [1, 0, 0]);
    }
    // top (+y)
    if (!blocks[makeKey(nx, ny + t2, nz)]) {
      pushFace([c[4], c[8], c[3], c[3], c[8], c[7]], [0, 1, 0]);
    }
    // bottom (-y)
    if (!blocks[makeKey(nx, ny - t2, nz)]) {
      pushFace([c[5], c[1], c[6], c[6], c[1], c[2]], [0, -1, 0]);
    }
  });

  return [vertices, uvs, normals];
}
