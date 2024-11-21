import create from "zustand";
import { nanoid } from "nanoid";

/*

UseStore is not used anymore, we talk about deleteing this.

Main Reason is that it got in the way of renders, I believe useRef wasn't something it let us use.

Future:
  might be helpful in terms future save and load worlds?? unsure.



*/

const getLocalStorage = (key) => JSON.parse(window.localStorage.getItem(key));
const setLocalStorage = (key, value) =>
  window.localStorage.setItem(key, JSON.stringify(value));

export const useStore = create((set, get) => ({
  texture: "dirt",
  setTexture: (texture) => {
    set(() => ({
      texture,
    }));
  },

  cubes: getLocalStorage("cubes") || [],
  online_updateCubes: (cubes) => {
    set(() => ({
      cubes,
    }));
  },
  addCube: (x, y, z) => {
    set((prev) => ({
      cubes: [
        ...prev.cubes,
        {
          key: nanoid(),
          pos: [x, y, z],
          texture: prev.texture,
        },
      ],
    }));
  },
  removeCube: (x, y, z) => {
    set((prev) => ({
      cubes: prev.cubes.filter((cube) => {
        const [X, Y, Z] = cube.pos;
        return X !== x || Y !== y || Z !== z;
      }),
    }));
  },

  establishedConn: false,
  online_setEstablishedConn: (establishedConn) => {
    set(() => ({
      establishedConn,
    }));
  },

  socket: null,
  online_Addsocket: (s) => {
    set(() => ({
      socket: s,
    }));
  },

  players: {},
  online_setPlayersPos: (allplayersmap) => {
    let playerNum = get().playerNum;
    delete allplayersmap[playerNum];
    set(() => ({
      players: { ...allplayersmap },
    }));
  },

  playerNum: null,
  online_setPlayerNum: (playerNum) => {
    set(() => ({
      playerNum,
    }));
  },

  /* 
		example entry
		'0.0.0':{
			'pos':[0,0,0],
			// font back left right top bottom
			'showface':[true,true,true,false,false,false],
			texture: 'wood'
		}
	*/
  allBlocks: [
    {
      "0.0.0": { pos: [0, 0, 0], texture: "log" },
    },
  ],
  updateAllBlocks: (data) => {
    set(() => ({
      allBlocks: [data],
    }));
  },
  getAllBlocks: () => {
    return get().allBlocks[0];
  },

  saveWorld: () => {
    setLocalStorage("cubes", get().cubes);
    window.location.reload();
  },
  resetWorld: () => {
    set(() => ({
      cubes: [],
    }));
  },
  online_resetWorld: () => {
    let params = {
      worldname: null,
    };
    let socket = get().socket;
    if (socket) {
      if (socket.connected) {
        socket.emit("C_resetBlocks", params);
      }
    }
  },
  online_sendPos: (pos) => {
    let playerNum = get().playerNum;
    let params = {
      worldname: null,
      playerNum,
      pos,
    };
    let socket = get().socket;
    if (socket) {
      if (socket.connected) {
        socket.emit("C_UpdateMove", params);
      }
    }
  },

  online_addCube: (x, y, z) => {
    let params = {
      worldname: null,
      pos: [x, y, z],
      key: nanoid(),
      texture: get().texture,
    };
    let socket = get().socket;
    if (socket) {
      if (socket.connected) {
        socket.emit("C_addBlock", params);
      }
    }
  },
  online_removeCube: (x, y, z) => {
    let params = {
      worldname: null,
      pos: [x, y, z],
    };
    let socket = get().socket;
    if (socket) {
      if (socket.connected) {
        socket.emit("C_removeBlock", params);
      }
    }
  },
}));
