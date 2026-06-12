// Chunk ids are laid out x-major: id = worldSize * chunkX + chunkZ,
// where chunkX/chunkZ are the chunk's grid coordinates.

export function chunkIdToXY(id, worldSize) {
  const y = Math.floor(id / worldSize);
  const x = id - y * worldSize;
  return { x, y };
}

export function distBetweenChunks(idA, idB, worldSize) {
  const a = chunkIdToXY(idA, worldSize);
  const b = chunkIdToXY(idB, worldSize);
  return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5;
}

export function chunkIdFromPosition(x, z, { worldSize, chunkSize }) {
  return worldSize * Math.floor(x / chunkSize) + Math.floor(z / chunkSize);
}

// All chunk ids within `radius` (euclidean, in chunk units) of currentChunk,
// clipped to the world bounds.
export function getNearbyChunkIds(currentChunk, radius, worldSize) {
  const nearby = new Set();
  const cc = chunkIdToXY(currentChunk, worldSize);

  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      const id = currentChunk + worldSize * y + x;
      if (id < 0 || id >= worldSize * worldSize) {
        continue;
      }

      const p = chunkIdToXY(id, worldSize);
      const chunkDist = ((p.x - cc.x) ** 2 + (p.y - cc.y) ** 2) ** 0.5;
      if (chunkDist > radius) {
        continue;
      }

      nearby.add(id);
    }
  }

  return [...nearby];
}
