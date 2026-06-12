// Chunks are identified by string keys "cx.cz" where cx/cz are the chunk's
// grid coordinates (floor(blockX / chunkSize)). The world is unbounded, so
// coordinates can be negative.

export function chunkKey(cx, cz) {
  return cx + "." + cz;
}

export function parseChunkKey(key) {
  const [cx, cz] = key.split(".").map(Number);
  return { cx, cz };
}

export function chunkCoordsFromPosition(x, z, chunkSize) {
  return { cx: Math.floor(x / chunkSize), cz: Math.floor(z / chunkSize) };
}

export function chunkKeyFromPosition(x, z, chunkSize) {
  const { cx, cz } = chunkCoordsFromPosition(x, z, chunkSize);
  return chunkKey(cx, cz);
}

export function distBetweenChunks(keyA, keyB) {
  const a = parseChunkKey(keyA);
  const b = parseChunkKey(keyB);
  return ((a.cx - b.cx) ** 2 + (a.cz - b.cz) ** 2) ** 0.5;
}

// All chunk keys within `radius` (euclidean, in chunk units) of centerKey.
export function getNearbyChunkKeys(centerKey, radius) {
  const { cx, cz } = parseChunkKey(centerKey);
  const nearby = [];
  const r = Math.ceil(radius);

  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      if ((dx ** 2 + dz ** 2) ** 0.5 > radius) {
        continue;
      }
      nearby.push(chunkKey(cx + dx, cz + dz));
    }
  }

  return nearby;
}
