// Game configuration. Mostly static, but a few fields are set at runtime
// from the title screen: movewithJOY_BOOL, onlineEnabled, playerName, and
// worldSettings.seed.
const settings = {
  // tries the multiplayer server; falls back to offline if unreachable
  onlineEnabled: false,
  // when online, connect to the deployed ReactMineCraftCloneServer instead of localhost
  useRemoteServer: false,
  playerName: "Player",
  // id of the active singleplayer save (set from the title screen); the world's
  // block edits are loaded/saved under this id
  currentSaveId: null,

  showPlayer: true,
  showOtherPlayers: true,
  ignoreCameraFollowPlayer: false, //@TODO: rename
  movewithJOY_BOOL: false, // laptop default

  showCubes: true,

  // touch/joystick mode: when true, tapping a block breaks it; when false,
  // tapping places the selected block. Toggled by the on-screen Break button
  // (see LowerControlStrip). Ignored in desktop/mouse mode.
  breakMode: false,

  viewRadius: 6, //distance (in chunks) from current chunk that chunks are shown
  outerViewRadius: 8, //distance (in chunks) we insure are built/ready to be shown
  renderDistPrecentage: 50 / 100,
  fillBatchSize: 10,
  // how many ready chunks to mount (upload to the GPU) per frame. The worker
  // can hand back a whole batch at once; mounting them all in one frame stalls
  // the render thread, so we drain a few per frame instead. Higher = faster
  // pop-in but more hitching; lower = smoother but slower to fill in.
  chunkMountBudget: 4,
  workerCount: 3,

  showLoadingWorldBanner: true,

  startingPositionDefault: [2, 30, 2],
  startingRotationDefault: [-45, 220, 0].map((val) => {
    return (val * Math.PI) / 180;
  }),

  //world set up configs -- the world is infinite; chunks generate on demand
  worldSettings: {
    seed: "robo",
    chunkSize: 8, //this squared is the number of block columns in each chunk
    heightFactor: 12, //how high up noise can make hills
    waterLevel: 0, //columns below this height fill with water
    minY: -64, //bedrock floor -- deep so caves have lots of vertical room to generate
  },
};

export default settings;
