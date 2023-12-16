

const settings= {
    online: false,
    herokuserver: false,
    useOrbitals:false,

    hidePlayer: false,
    hideOtherPlayers: true,
    ignoreCameraFollowPlayer: false,
    movewithJOY_BOOL: false, // laptop default

    hideSky: true,
    hideGround: true,
    hideCubes:false,
    hideCubeRigidBodyLines: true, //doesn't work yet
    ignoreCubeRigidBody: true,
    hideTextSelect: true,
    hideUIContent:true,

    viewRadius:5,//this number is distance from current place chunks are allowed to be shown
    outerViewRadius:16,//this number is the distance from current place we insure are built/ready to be shown
    renderDistPrecentage: 50/100,
    fillBatchSize:10,
    workerCount:3,

    showtexturesfromcubeheight: false,
    activeTexture: 'AllMinecraftTexture',

    randomizeStartPos:true,
    startingPositionDefault:[2,3,2],
    startingRotationDefault:[-45,220,0].map((val)=>{return val*Math.PI/180}),
    startingChunk:-1, //gets calculated below

    //world set up configs
    worldSettings:{
        useHeightTextures: false,
        showFlatWorld: true,
        seed: "robo",
        worldSize: 100, //this squareD is the number of chunks in the world
        chunkSize: 16, //this sqareD is the size of each chunk
        heightFactor: 1, //how high up noise can make hills
        depth: 0, // how far down blocks are stacked
      }





}
settings.startingChunk = settings.worldSettings.worldSize * Math.floor(settings.startingPositionDefault[0] / settings.worldSettings.chunkSize) + Math.floor(settings.startingPositionDefault[2] / settings.worldSettings.chunkSize);

export default settings

/* Default settings


online: false,
herokuserver: false,
useOrbitals:false,

hidePlayer: false,
hideOtherPlayers: true,
ignoreCameraFollowPlayer: false,

hideSky: false,
hideGround: false,
hideCubes:false,
hideCubeRigidBody: false,
ignoreCubeRigidBody: true,
hideTextSelect: false,
hideUIContent:false,


activeTexture: 'AllMinecraftTexture'



*/