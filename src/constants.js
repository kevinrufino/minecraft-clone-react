const settings = {
  onlineEnabled: false,
  herokuServer: false,

  showPlayer: true,
  showOtherPlayers: true,
  ignoreCameraFollowPlayer: false, //@TODO: rename
  movewithJOY_BOOL: false, // laptop default

  showCubes: true,
  showCubeRigidBodyLines: false, //doesn't work yet
  ignoreCubeRigidBody: true,

  viewRadius: 16, //this number is distance from current place chunks are allowed to be shown
  outerViewRadius: 20, //this number is the distance from current place we insure are built/ready to be shown
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
    worldSize: 3, //this squared is the number of chunks in the world
    chunkSize: 3, //this squared is the number of blocks in each chunk
    heightFactor: 10, //how high up noise can make hills
    depth: 0, // how far down blocks are stacked
  },
};
settings.startingChunk =
  settings.worldSettings.worldSize *
    Math.floor(
      settings.startingPositionDefault[0] / settings.worldSettings.chunkSize,
    ) +
  Math.floor(
    settings.startingPositionDefault[2] / settings.worldSettings.chunkSize,
  );

export default settings;
