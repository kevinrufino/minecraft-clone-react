import create from "zustand";
import { nanoid } from "nanoid";
import settings from "../constants";

// Render-distance bounds (in chunks). The auto-tuner and the pause-menu
// slider share these limits.
export const RENDER_MIN = 3;
export const RENDER_MAX = 16;

// First guess at render distance from device telemetry; PerformanceMonitor
// then walks it up or down based on measured frame rate -- until the player
// takes over with the pause-menu slider.
function initialViewRadius() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4; // GB; undefined on Safari/Firefox
  if (cores >= 8 && mem >= 8) return 6;
  if (cores >= 4) return 5;
  return 4;
}

// Render distance lives in the mutable `settings` global because the chunk
// engine reads it every frame (see Cubes.jsx); the store value mirrors it so
// React components (fog, the slider) re-render when it changes.
function applyViewRadius(r) {
  const next = Math.min(RENDER_MAX, Math.max(RENDER_MIN, r));
  settings.viewRadius = next;
  settings.outerViewRadius = next + 2;
  return next;
}

// Global store for cross-component state: the currently selected texture,
// render settings (FPS overlay + render distance), and everything related to
// online play (socket, other players, connection state). World/block data
// intentionally lives outside this store (in refs) because it changes every
// frame and zustand re-renders got in the way.
export const useStore = create((set, get) => ({
  texture: "dirt",

  // ── render settings (driven by the pause menu) ──────────────────
  showFPS: false,
  toggleShowFPS: () => set((s) => ({ showFPS: !s.showFPS })),

  viewRadius: applyViewRadius(initialViewRadius()),
  // PerformanceMonitor auto-tunes render distance until the player drags the
  // slider, which hands control over to them for the rest of the session
  renderDistanceAuto: true,
  setViewRadius: (r) => set(() => ({ viewRadius: applyViewRadius(r), renderDistanceAuto: false })),
  autoAdjustViewRadius: (delta) =>
    set((s) => (s.renderDistanceAuto ? { viewRadius: applyViewRadius(s.viewRadius + delta) } : {})),

  // 9 hotbar slots, each holding a block name; the selected slot is the
  // block that gets placed. Assignable from the creative inventory (E).
  hotbar: [
    "grass",
    "dirt",
    "stone",
    "cobblestone",
    "sand",
    "log",
    "wood",
    "glass",
    "leaves",
  ],
  selectedSlot: 0,
  inventoryOpen: false,
  // touch/joystick pause -- desktop pauses by releasing pointer lock, but mobile
  // has no pointer lock, so the on-screen pause button drives this flag instead
  paused: false,

  establishedConn: false,
  socket: null,
  players: {},
  playernum: null,

  // ── in-game chat ────────────────────────────────────────────────
  // recent messages: {id, name, text, t}. Kept to the last 50.
  chat: [],
  // true while the chat input is focused; the movement/hotbar/mute/inventory
  // key handlers consult it so typing doesn't drive the game. Lives in the
  // store (not settings) so PauseOverlay reactively hides while chat is open.
  chatOpen: false,
  setChatOpen: (chatOpen) => set(() => ({ chatOpen })),
  online_pushChat: (name, text) =>
    set((s) => ({
      chat: [
        ...s.chat.slice(-49),
        { id: nanoid(), name, text, t: Date.now() },
      ],
    })),
  online_sendChat: (text) => {
    const name = settings.playerName || "Player";
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit("C_chat", { worldname: null, name, text });
    }
    // optimistic local echo so you always see your own message immediately.
    // The server relay should broadcast S_chat to OTHER players only (not the
    // sender) so this doesn't double up.
    get().online_pushChat(name, text);
  },

  setTexture: (texture) => {
    set(() => ({
      texture,
    }));
  },

  setSelectedSlot: (selectedSlot) => {
    set(() => ({ selectedSlot }));
  },
  setHotbarSlot: (index, block) => {
    set((state) => {
      const hotbar = [...state.hotbar];
      hotbar[index] = block;
      return { hotbar };
    });
  },
  setInventoryOpen: (inventoryOpen) => {
    set(() => ({ inventoryOpen }));
  },
  setPaused: (paused) => {
    set(() => ({ paused }));
  },

  online_addCube: (pos, texture) => {
    let params = {
      worldname: null,
      pos,
      key: nanoid(),
      texture: texture || get().texture,
    };
    let socket = get().socket;
    if (socket && socket.connected) {
      socket.emit("C_addBlock", params);
    }
  },
  online_removeCube: (pos) => {
    let params = {
      worldname: null,
      pos,
    };
    let socket = get().socket;
    if (socket && socket.connected) {
      socket.emit("C_removeBlock", params);
    }
  },
  online_resetWorld: () => {
    let params = {
      worldname: null,
    };
    let socket = get().socket;
    if (socket && socket.connected) {
      socket.emit("C_resetBlocks", params);
    }
  },
  online_sendPos: (pos) => {
    let params = {
      worldname: null,
      playernum: get().playernum,
      pos,
    };
    let socket = get().socket;
    if (socket && socket.connected) {
      socket.emit("C_UpdateMove", params);
    }
  },
  online_setPlayersPos: (allplayersmap) => {
    let playernum = get().playernum;
    delete allplayersmap[playernum];
    set(() => ({
      players: { ...allplayersmap },
    }));
  },
  online_setplayerNum: (playernum) => {
    set(() => ({
      playernum,
    }));
  },
  online_Addsocket: (s) => {
    set(() => ({
      socket: s,
    }));
  },
  online_SetEstablishedConn: (establishedConn) => {
    set(() => ({
      establishedConn,
    }));
  },
}));
