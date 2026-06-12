import { makeKey } from "./keys";
import { chunkKeyFromPosition } from "./chunkMath";

// The world is fully determined by (seed + edits). An edit is a block the
// player added or removed relative to the generated terrain:
//   { type: "add", pos: [x,y,z], texture } | { type: "remove", pos }
// Edits are applied by the chunk worker at generation time, so they survive
// for chunks that don't exist yet (remote replay, persistence reload).
// Keyed by block key; the latest edit for a position wins.

let edits = {};
let storageKey = null;
let saveTimer = null;

export function recordEdit(event, persist) {
  edits[makeKey(...event.pos)] = event;
  if (persist) {
    scheduleSave();
  }
}

// Returns { blockKey -> edit } for edits that fall inside the given chunks.
export function editsForChunks(chunkKeys, chunkSize) {
  const wanted = new Set(chunkKeys);
  const result = {};
  for (const [key, event] of Object.entries(edits)) {
    const ck = chunkKeyFromPosition(event.pos[0], event.pos[2], chunkSize);
    if (wanted.has(ck)) {
      result[key] = event;
    }
  }
  return result;
}

export function loadEdits(seed) {
  storageKey = `clonecraft-edits-${seed}`;
  try {
    edits = JSON.parse(window.localStorage.getItem(storageKey)) || {};
  } catch {
    edits = {};
  }
  return Object.keys(edits).length;
}

export function clearEdits() {
  edits = {};
  if (storageKey) {
    window.localStorage.removeItem(storageKey);
  }
}

function scheduleSave() {
  if (!storageKey || saveTimer) {
    return;
  }
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(edits));
    } catch (err) {
      console.warn("Could not save world edits:", err);
    }
  }, 1000);
}
