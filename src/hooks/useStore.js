import create from "zustand";
import { nanoid } from "nanoid";


/*

UseStore is not used anymore, we talk about deleteing this.

Main Reason is that it got in the way of renders, I believe useRef wasn't something it let us use.

Future:
  might be helpful in terms future save and load worlds?? unsure.



*/



const getLocalStorage = (key) => JSON.parse(window.localStorage.getItem(key));
const setLocalStorage = (key, value) => window.localStorage.setItem(key, JSON.stringify(value));

export const useStore = create((set, get) => ({
  texture: "dirt",
  cubes: getLocalStorage("cubes") || [],

  establishedConn: false,
  socket: null,
  players: {},
  playernum: null,

  AllBlocks: [
    {
      "0.0.0": { pos: [0, 0, 0], texture: "log" },
      /* 
		example entry
		'0.0.0':{
			'pos':[0,0,0],
			// font back left right top bottom
			'showface':[true,true,true,false,false,false],
			texture: 'wood'
		}
		*/
    },
  ],
  updateAllBlocks: (data) => {
    set(() => ({
      AllBlocks: [data],
    }));
  },
  getAllBlocks: () => {
    return get().AllBlocks[0];
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
  online_updateCubes: (cubes) => {
    set(() => ({
      cubes,
    }));
  },
  online_Addsocket: (s) => {
    set(() => ({
      socket: s,
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
    let playernum = get().playernum;
    let params = {
      worldname: null,
      playernum,
      pos,
    };
    let socket = get().socket;
    if (socket) {
      if (socket.connected) {
        socket.emit("C_UpdateMove", params);
      }
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
  online_SetEstablishedConn: (establishedConn) => {
    set(() => ({
      establishedConn,
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
  setTexture: (texture) => {
    set(() => ({
      texture,
    }));
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
}));
