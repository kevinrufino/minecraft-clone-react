import { makeKey } from "./keys";
import {
  tileFor,
  ATLAS_UV_SIZE,
  TRANSPARENT_TEXTURES,
  GRASS_TINT,
  FACE_SHADE,
} from "./atlas";

function faceUVs(texture, face) {
  const [col, row] = tileFor(texture, face);
  const uvL = (col - 1) * ATLAS_UV_SIZE;
  const uvB = (row - 1) * ATLAS_UV_SIZE;
  return [
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
}

function isTransparent(texture) {
  return TRANSPARENT_TEXTURES.includes(texture);
}

// A face is hidden when its neighbor fully covers it:
// - opaque blocks cull against opaque neighbors
// - transparent blocks cull against the same texture (water-water,
//   glass-glass) and against opaque neighbors
function faceHidden(texture, neighbor) {
  if (!neighbor) {
    return false;
  }
  if (!isTransparent(neighbor.texture)) {
    return true;
  }
  return neighbor.texture === texture;
}

// Builds flat vertex/uv/normal/color arrays for every exposed face of a
// chunk, split into an opaque set and a transparent (water/glass/leaves)
// set. `t` is the block half-thickness; `blocks` must contain the chunk's
// blocks plus neighbors so faces shared with adjacent chunks get culled.
export function genFaceArrays(t, blocks, chunkBlocks) {
  const t2 = 2 * t;
  const out = {
    solid: { vertices: [], uvs: [], normals: [], colors: [] },
    trans: { vertices: [], uvs: [], normals: [], colors: [] },
  };

  chunkBlocks.keys.forEach((cen) => {
    const block = blocks[cen];
    if (!block) {
      return;
    }
    let [nx, ny, nz] = cen.split(".");
    const [x, y, z] = block.pos;
    const texture = block.texture;
    const target = isTransparent(texture) ? out.trans : out.solid;

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

    function pushFace(corners, normal, face, shade) {
      target.vertices.push(...corners[0], ...corners[1], ...corners[2]);
      target.vertices.push(...corners[3], ...corners[4], ...corners[5]);
      // grass tops and leaves are grayscale tiles tinted green (classic MC)
      const tint =
        (texture === "grass" && face === "top") || texture === "leaves"
          ? GRASS_TINT
          : [1, 1, 1];
      for (let i = 0; i < 6; i++) {
        target.normals.push(...normal);
        target.colors.push(tint[0] * shade, tint[1] * shade, tint[2] * shade);
      }
      target.uvs.push(...faceUVs(texture, face));
    }

    // front (+z)
    if (!faceHidden(texture, blocks[makeKey(nx, ny, nz + t2)])) {
      pushFace(
        [c[1], c[4], c[2], c[2], c[4], c[3]],
        [0, 0, 1],
        "side",
        FACE_SHADE.north,
      );
    }
    // back (-z)
    if (!faceHidden(texture, blocks[makeKey(nx, ny, nz - t2)])) {
      pushFace(
        [c[6], c[7], c[5], c[5], c[7], c[8]],
        [0, 0, -1],
        "side",
        FACE_SHADE.south,
      );
    }
    // left (-x)
    if (!faceHidden(texture, blocks[makeKey(nx - t2, ny, nz)])) {
      pushFace(
        [c[2], c[3], c[6], c[6], c[3], c[7]],
        [-1, 0, 0],
        "side",
        FACE_SHADE.west,
      );
    }
    // right (+x)
    if (!faceHidden(texture, blocks[makeKey(nx + t2, ny, nz)])) {
      pushFace(
        [c[5], c[8], c[1], c[1], c[8], c[4]],
        [1, 0, 0],
        "side",
        FACE_SHADE.east,
      );
    }
    // top (+y)
    if (!faceHidden(texture, blocks[makeKey(nx, ny + t2, nz)])) {
      pushFace(
        [c[4], c[8], c[3], c[3], c[8], c[7]],
        [0, 1, 0],
        "top",
        FACE_SHADE.top,
      );
    }
    // bottom (-y)
    if (!faceHidden(texture, blocks[makeKey(nx, ny - t2, nz)])) {
      pushFace(
        [c[5], c[1], c[6], c[6], c[1], c[2]],
        [0, -1, 0],
        "bottom",
        FACE_SHADE.bottom,
      );
    }
  });

  return out;
}

// Packs a genFaceArrays result into typed arrays ready for postMessage.
export function packDrawArrays(arrays) {
  const pack = (set) => ({
    vertices: new Float32Array(set.vertices),
    uvs: new Float32Array(set.uvs),
    normals: new Float32Array(set.normals),
    colors: new Float32Array(set.colors),
  });
  return { solid: pack(arrays.solid), trans: pack(arrays.trans) };
}
