import { chunkIdFromPosition } from "./world/chunkMath";

// Game configuration. Mostly static, but a few fields are set at runtime:
// - movewithJOY_BOOL comes from the title screen choice
// - startingChunk is recalculated when the start position is randomized
const settings = {
  // tries localhost:5000 (or the remote server); falls back to offline if unreachable
  onlineEnabled: true,
  // when online, connect to the deployed ReactMineCraftCloneServer instead of localhost
  useRemoteServer: false,

  showPlayer: true,
  showOtherPlayers: true,
  ignoreCameraFollowPlayer: false, //@TODO: rename
  movewithJOY_BOOL: false, // laptop default

  showCubes: true,

  viewRadius: 6, //distance (in chunks) from current chunk that chunks are shown
  outerViewRadius: 8, //distance (in chunks) we ensure are built/ready to be shown
  renderDistPrecentage: 50 / 100,
  fillBatchSize: 10,
  workerCount: 3,

  showLoadingWorldBanner: false,

  activeTexture: "AllMinecraftTexture",

  randomizeStartPos: false,
  startingPositionDefault: [2, 30, 2],
  startingRotationDefault: [-45, 220, 0].map((val) => {
    return (val * Math.PI) / 180;
  }),
  startingChunk: -1, //gets calculated below

  //world set up configs
  worldSettings: {
    useHeightTextures: false,
    showFlatWorld: false,
    seed: "robo",
    worldSize: 16, //this squared is the number of chunks in the world
    chunkSize: 8, //this squared is the number of blocks in each chunk
    heightFactor: 10, //how high up noise can make hills
    depth: 0, // how far down blocks are stacked
  },
};

settings.startingChunk = chunkIdFromPosition(
  settings.startingPositionDefault[0],
  settings.startingPositionDefault[2],
  settings.worldSettings,
);

export default settings;
