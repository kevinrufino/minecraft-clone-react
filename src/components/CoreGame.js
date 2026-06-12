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
import { useControls } from "leva";

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

  // live debug panel -- tweak render toggles here while playing
  const {
    showUIContent,
    showTextureSelector,
    showFPS,
    showSky,
    orbitalControlsEnabled,
  } = useControls({
    showUIContent: { value: false, label: "show UI content" },
    showTextureSelector: { value: false, label: "show texture selector" },
    showFPS: { value: true, label: "show FPS" },
    showSky: { value: true, label: "show sky" },
    orbitalControlsEnabled: { value: false, label: "orbital controls" },
  });

  function updateInitStatus(obj) {
    setInitStatus((prev) => ({ ...prev, ...obj }));
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
        <Scene
          activeTextureREF={activeTextureREF}
          updateInitStatus={updateInitStatus}
          initStatus={initStatus}
          chunksMadeCounter={chunksMadeCounter}
          moveBools={moveBools}
        />

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
