import create from "zustand";
import { nanoid } from "nanoid";

// Global store for cross-component state: the currently selected texture and
// everything related to online play (socket, other players, connection state).
// World/block data intentionally lives outside this store (in refs) because
// it changes every frame and zustand re-renders got in the way.
export const useStore = create((set, get) => ({
  texture: "dirt",

  establishedConn: false,
  socket: null,
  players: {},
  playernum: null,

  setTexture: (texture) => {
    set(() => ({
      texture,
    }));
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
