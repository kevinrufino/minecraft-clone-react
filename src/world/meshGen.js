import { makeKey } from "./keys";
import {
  tileFor,
  ATLAS_UV_SIZE,
  TRANSPARENT_TEXTURES,
  GRASS_TINT,
  FACE_SHADE,
} from "./atlas";

// inset UVs by a sliver of a texel so samples never bleed into the
// neighboring atlas tile
const UV_EPS = ATLAS_UV_SIZE / 64;

function faceUVs(texture, face) {
  const [col, row] = tileFor(texture, face);
  const uvL = (col - 1) * ATLAS_UV_SIZE + UV_EPS;
  const uvR = col * ATLAS_UV_SIZE - UV_EPS;
  const uvB = (row - 1) * ATLAS_UV_SIZE + UV_EPS;
  const uvT = row * ATLAS_UV_SIZE - UV_EPS;
  return [uvR, uvB, uvR, uvT, uvL, uvB, uvL, uvB, uvR, uvT, uvL, uvT];
}

function isTransparent(texture) {
  return TRANSPARENT_TEXTURES.includes(texture);
}

// Surface height (fraction of a full block, 0..1) for a water cell, by how far
// it has flowed. Generated source water has no `flow` field and sits near full;
// flowing water (flow 1..4, set in Cubes.jsx's water sim, 4 = strongest) lowers
// its surface the further it has spread -- so streams visibly slope downhill.
function waterTopFrac(flow) {
  if (flow == null) {
    return 0.9; // source / falling water -- effectively a full block
  }
  return 0.3 + 0.55 * ((flow - 1) / 3);
}

// Surface fraction of the water cell at (nx,ny,nz), or null if that column
// isn't a water *surface* cell at this level (not water, or submerged with
// water directly above). Used to average corner heights between neighbours so
// the surface slopes smoothly instead of stepping between flow levels.
function waterSurfaceFracAt(blocks, nx, ny, nz, t2) {
  const cell = blocks[makeKey(nx, ny, nz)];
  if (!cell || cell.texture !== "water") {
    return null;
  }
  const above = blocks[makeKey(nx, ny + t2, nz)];
  if (above && above.texture === "water") {
    return null; // submerged -- its surface is higher up, not here
  }
  return waterTopFrac(cell.flow);
}

// Height of a water surface corner, averaged over the (up to 4) surface water
// columns that meet at it. dx/dz pick which diagonal corner (each ±1 in block
// units). The cell itself always contributes, so a corner shared by cells of
// different flow lands halfway between them -- turning the per-cell steps into
// a continuous sloped surface.
function waterCornerY(blocks, nx, ny, nz, dx, dz, y, t, t2) {
  let sum = 0;
  let count = 0;
  for (const [ox, oz] of [
    [0, 0],
    [dx * t2, 0],
    [0, dz * t2],
    [dx * t2, dz * t2],
  ]) {
    const frac = waterSurfaceFracAt(blocks, nx + ox, ny, nz + oz, t2);
    if (frac != null) {
      sum += frac;
      count++;
    }
  }
  const frac = count > 0 ? sum / count : waterTopFrac(null);
  return y - t + t2 * frac;
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

    // a water cell with air above is a surface cell -- drop its top (and the
    // top edges of its side faces). Each top corner is averaged with the
    // neighbouring surface cells that meet there, so adjacent flow levels
    // slope into each other smoothly instead of stepping. Corners c3/c4/c7/c8
    // are shared by the top and the side faces, so the side tops follow too.
    if (texture === "water") {
      const above = blocks[makeKey(nx, ny + t2, nz)];
      if (!above || above.texture !== "water") {
        c[3][1] = waterCornerY(blocks, nx, ny, nz, -1, 1, y, t, t2); // -x +z
        c[4][1] = waterCornerY(blocks, nx, ny, nz, 1, 1, y, t, t2); //  +x +z
        c[7][1] = waterCornerY(blocks, nx, ny, nz, -1, -1, y, t, t2); // -x -z
        c[8][1] = waterCornerY(blocks, nx, ny, nz, 1, -1, y, t, t2); //  +x -z
      }
    }

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
