//@TODO: I hate this name but couldn't come up with a better one
import { Physics } from "@react-three/cannon";
import { PerformanceMonitor, Sky, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { TextureSelector } from "./TextureSelector";
import { Menu } from "./UIComponents/Menu";
import { Help } from "./UIComponents/Help";
import { Scene } from "./Scene";
import settings from "../constants";
import { OrbitControls } from "@react-three/drei";
import { LoadingWorldScreen } from "./UIComponents/LoadingWorldScreen";
import LowerControlStrip from "../hooks/LowerControlStrip";
import { useRef, useState } from "react";
import { useControls, button } from "leva";

const CoreGame = () => {
  let moveBools = useRef({
    moveBackward: false,
    moveForward: false,
    moveLeft: false,
    moveRight: false,
    jump: false,
    moveQuick: false,
    moveQuickTC: 0, //tap count
    moveQuickTT: 0, //tap time
    jumpTT: 0,
    jumpTC: 0,
    camUp: false,
    camDown: false,
    camLeft: false,
    camRight: false,
    camCenter: false,
    camCenterTT: 0,
    camCenterTC: 0,
  });
  const activeTextureREF = useRef("dirt");
  const chunksMadeCounter = useRef({
    loaddone: false,
    track: { count: 0, max: settings.worldSettings.worldSize ** 2 },
  });
  const [initStatus, setInitStatus] = useState({
    buildWorkers: 0,
    initWorkers: 0,
    initWorld: 0,
  });

  // @TODO: use this for debugging live, lets update the constants file and other states that we want to tweak live from here
  const {
    showUIContent,
    showTextureSelector,
    showFPS,
    showSky,
    orbitalControlsEnabled,
  } = useControls({
    // minDistance: { value: 0 },
    testBUtton: button(() => console.log("test button clicked")),
    showUIContent: { value: false, label: "show UI content" },
    showTextureSelector: { value: false, label: "show texture selector" },
    showFPS: { value: true, label: "show FPS" },
    showSky: { value: false, label: "show sky" },
    orbitalControlsEnabled: { value: false, label: "orbital controls" },
  });

  const movewithJOY_BOOL = true; //@TODO: Should we just get this from settings.movewithJOY_BOOL

  function updateInitStatus(obj) {
    setInitStatus({ ...initStatus.current, ...obj });
  }
  return (
    <>
      {settings.showLoadingWorldBanner ? (
        <LoadingWorldScreen
          buildWorkers={initStatus.buildWorkers}
          chunksMadeCounter={chunksMadeCounter}
        />
      ) : (
        <></>
      )}
      <Canvas>
        {showFPS && <Stats />}
        <PerformanceMonitor
          onIncline={() =>
            console.log("@TODO: performance is good, lets load more chunks")
          }
          onDecline={() =>
            console.log("@TODO: performance is bad, lets load less chunks")
          }
        />
        {showSky && <Sky name={"skyMesh"} sunPosition={[100, 100, 20]} />}
        <ambientLight intensity={0.5} />
        <Physics>
          <Scene
            activeTextureREF={activeTextureREF}
            updateInitStatus={updateInitStatus}
            initStatus={initStatus}
            chunksMadeCounter={chunksMadeCounter}
            moveBools={moveBools}
            movewithJOY_BOOL={movewithJOY_BOOL}
          />
        </Physics>

        {orbitalControlsEnabled && <OrbitControls />}
        <axesHelper name={"axesHelper"} scale={10} />
      </Canvas>
      {settings.movewithJOY_BOOL && <LowerControlStrip moveBools={moveBools} />}
      {showUIContent && (
        <>
          <Menu />
          <Help />
        </>
      )}
      {!settings.ignoreCameraFollowPlayer && (
        <div className="cursor centered absolute">+</div>
      )}
      {showTextureSelector && (
        <TextureSelector activeTextureREF={activeTextureREF} />
      )}
    </>
  );
};

export default CoreGame;
