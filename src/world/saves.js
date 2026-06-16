import { nanoid } from "nanoid";

// Registry of named singleplayer saves. A save is metadata only:
//   { id, name, seed, updatedAt }
// The actual block edits live in edits.js under `clonecraft-edits-<id>`.
// Keeping the list separate lets several saves share a seed and carry a
// friendly name, and lets "Load World" enumerate worlds without parsing
// every edit blob.

const REGISTRY_KEY = "clonecraft-saves";
const EDITS_PREFIX = "clonecraft-edits-";
const MIGRATED_KEY = "clonecraft-saves-migrated";

function readRegistry() {
  try {
    return JSON.parse(window.localStorage.getItem(REGISTRY_KEY)) || [];
  } catch {
    return [];
  }
}

function writeRegistry(list) {
  try {
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Could not write saves registry:", err);
  }
}

// One-time import of pre-registry worlds, which were keyed by seed under
// `clonecraft-edits-<seed>`. At the moment this first runs every such key is a
// legacy world (nanoid save ids didn't exist yet), so importing them all is
// safe; the flag then stops future autosave blobs from ever being imported,
// which keeps abandoned New World sessions out of the load list.
function migrateLegacySaves() {
  if (window.localStorage.getItem(MIGRATED_KEY)) return;
  const registry = readRegistry();
  const known = new Set(registry.map((s) => s.id));
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(EDITS_PREFIX)) continue;
    const id = key.slice(EDITS_PREFIX.length);
    if (known.has(id)) continue;
    let count = 0;
    try {
      count = Object.keys(
        JSON.parse(window.localStorage.getItem(key)) || {},
      ).length;
    } catch {
      count = 0;
    }
    if (count > 0) {
      // legacy key suffix is the seed, which doubles as the save name
      registry.push({ id, name: id, seed: id, updatedAt: 0 });
      known.add(id);
    }
  }
  writeRegistry(registry);
  window.localStorage.setItem(MIGRATED_KEY, "1");
}

migrateLegacySaves();

// Most-recently-saved first.
export function listSaves() {
  return readRegistry().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getSave(id) {
  if (!id) return null;
  return readRegistry().find((s) => s.id === id) || null;
}

// Create or update a save's metadata. Block edits are persisted separately.
export function upsertSave({ id, name, seed }) {
  const registry = readRegistry();
  const existing = registry.find((s) => s.id === id);
  if (existing) {
    existing.name = name;
    existing.seed = seed;
    existing.updatedAt = Date.now();
  } else {
    registry.push({ id, name, seed, updatedAt: Date.now() });
  }
  writeRegistry(registry);
}

export function deleteSave(id) {
  writeRegistry(readRegistry().filter((s) => s.id !== id));
  try {
    window.localStorage.removeItem(EDITS_PREFIX + id);
  } catch {
    /* ignore */
  }
}

export function createSaveId() {
  return nanoid();
}

// Short, readable random seed for New World when the player leaves it blank.
export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}
