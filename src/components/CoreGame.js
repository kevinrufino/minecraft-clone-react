import { PerformanceMonitor, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { TextureSelector } from "./TextureSelector";
import { Menu } from "./UIComponents/Menu";
import { Help } from "./UIComponents/Help";
import { Scene } from "./Scene";
import settings from "../constants";
import { OrbitControls } from "@react-three/drei";
import { LoadingWorldScreen } from "./UIComponents/LoadingWorldScreen";
import PauseOverlay from "./UIComponents/PauseOverlay";
import { DayNight } from "./effects/DayNight";
import { Clouds } from "./effects/Clouds";
import { BlockOutline } from "./effects/BlockOutline";
import { HeldBlock } from "./effects/HeldBlock";
import LowerControlStrip from "../hooks/LowerControlStrip";
import { useRef, useState } from "react";
import { useControls } from "leva";

const MIN_RADIUS = 3;
const MAX_RADIUS = 8;

// First guess at render distance from device telemetry; PerformanceMonitor
// then walks it up or down based on measured frame rate.
function initialViewRadius() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4; // GB; undefined on Safari/Firefox
  if (cores >= 8 && mem >= 8) {
    return 6;
  }
  if (cores >= 4) {
    return 5;
  }
  return 4;
}

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
    track: { count: 0, max: 0 }, // max is set once the initial fill is queued
  });
  const [initStatus, setInitStatus] = useState({
    buildWorkers: 0,
    initWorkers: 0,
    initWorld: 0,
  });
  const [viewRadius, setViewRadius] = useState(() => {
    const r = initialViewRadius();
    settings.viewRadius = r;
    settings.outerViewRadius = r + 2;
    return r;
  });

  function adjustViewRadius(delta) {
    setViewRadius((prev) => {
      const next = Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, prev + delta));
      settings.viewRadius = next;
      settings.outerViewRadius = next + 2;
      return next;
    });
  }

  // live debug panel -- tweak render toggles here while playing
  const { showUIContent, showFPS, showSky, orbitalControlsEnabled } =
    useControls({
      showUIContent: { value: false, label: "show UI content" },
      showFPS: { value: true, label: "show FPS" },
      showSky: { value: true, label: "show sky" },
      orbitalControlsEnabled: { value: false, label: "orbital controls" },
    });

  function updateInitStatus(obj) {
    setInitStatus((prev) => ({ ...prev, ...obj }));
  }

  const fogFar = viewRadius * settings.worldSettings.chunkSize;
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
        {/* fog hides the chunk-loading edge; scales with the live view radius */}
        <fog attach="fog" args={["#d7e7f5", fogFar * 0.35, fogFar * 0.85]} />
        {showFPS && <Stats />}
        <PerformanceMonitor
          onIncline={() => adjustViewRadius(1)}
          onDecline={() => adjustViewRadius(-1)}
        />
        <DayNight showSky={showSky} />
        <Clouds />
        <Scene
          activeTextureREF={activeTextureREF}
          updateInitStatus={updateInitStatus}
          initStatus={initStatus}
          chunksMadeCounter={chunksMadeCounter}
          moveBools={moveBools}
        />
        {/* after Scene so their useFrame runs after the camera has moved */}
        <BlockOutline />
        <HeldBlock />

        {orbitalControlsEnabled && <OrbitControls />}
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
      <TextureSelector activeTextureREF={activeTextureREF} />
      <PauseOverlay />
    </>
  );
};

export default CoreGame;
