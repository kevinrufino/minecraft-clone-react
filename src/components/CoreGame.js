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
import { PlayerList } from "./UIComponents/PlayerList";
import { Chat } from "./UIComponents/Chat";
import { Inventory } from "./UIComponents/Inventory";
import { DayNight } from "./effects/DayNight";
import { Clouds } from "./effects/Clouds";
import { BlockOutline } from "./effects/BlockOutline";
import { HeldBlock } from "./effects/HeldBlock";
import LowerControlStrip from "../hooks/LowerControlStrip";
import { useRef, useState, useEffect } from "react";
import { toggleSound, startAmbient } from "../world/sound";
import { useStore } from "../hooks/useStore";

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
  // render distance + FPS overlay live in the store so the pause menu can
  // drive them; PerformanceMonitor auto-tunes the radius until the player
  // takes over via the slider
  const viewRadius = useStore((s) => s.viewRadius);
  const showFPS = useStore((s) => s.showFPS);

  // render toggles (previously a leva debug panel; removed for a cleaner,
  // beginner-friendly player UI)
  const showUIContent = false;
  const showSky = true;
  const orbitalControlsEnabled = false;

  function updateInitStatus(obj) {
    setInitStatus((prev) => ({ ...prev, ...obj }));
  }

  // M toggles sound; start the ambient pad on the first user gesture (audio
  // can't begin until the browser has seen one)
  useEffect(() => {
    function onKey(e) {
      if (useStore.getState().chatOpen) return; // "m" is a letter while typing
      if (e.code === "KeyM") {
        toggleSound();
      }
    }
    function startOnce() {
      startAmbient();
      window.removeEventListener("pointerdown", startOnce);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", startOnce);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", startOnce);
    };
  }, []);

  // E toggles the creative inventory. Opening it releases the pointer lock so
  // the cursor can click blocks; closing re-locks to resume play. (PauseOverlay
  // checks inventoryOpen so it stays hidden while the inventory is up.)
  useEffect(() => {
    if (settings.movewithJOY_BOOL) {
      return; // touch devices use the on-screen UI, not pointer lock
    }
    function requestLock() {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        canvas.requestPointerLock();
      }
    }
    function onKey(e) {
      const st = useStore.getState();
      if (st.chatOpen) return; // "e" is a letter while typing in chat
      if (e.code === "KeyE") {
        if (st.inventoryOpen) {
          st.setInventoryOpen(false);
          requestLock();
        } else if (document.pointerLockElement) {
          // only open while actively playing (not from the pause/title screen)
          st.setInventoryOpen(true);
          document.exitPointerLock();
        }
      } else if (e.code === "Escape" && st.inventoryOpen) {
        st.setInventoryOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fogFar = viewRadius * settings.worldSettings.chunkSize;
  return (
    <>
      {settings.showLoadingWorldBanner ? (
        <LoadingWorldScreen buildWorkers={initStatus.buildWorkers} chunksMadeCounter={chunksMadeCounter} />
      ) : (
        <></>
      )}
      <Canvas>
        {/* fog hides the chunk-loading edge; scales with the live view radius */}
        <fog attach="fog" args={["#d7e7f5", fogFar * 0.35, fogFar * 0.85]} />
        {showFPS && <Stats />}
        <PerformanceMonitor
          onIncline={() => useStore.getState().autoAdjustViewRadius(1)}
          onDecline={() => useStore.getState().autoAdjustViewRadius(-1)}
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
      {settings.movewithJOY_BOOL && (
        <>
          <LowerControlStrip moveBools={moveBools} />
          {/* touch has no Esc key, so the pause/menu lives on-screen */}
          <button
            className="mobile-pause-btn"
            aria-label="Pause"
            onPointerDown={(e) => {
              e.preventDefault();
              useStore.getState().setPaused(true);
            }}
          >
            <span className="mobile-pause-btn__bars" />
          </button>
        </>
      )}
      {showUIContent && (
        <>
          <Menu />
          <Help />
        </>
      )}
      {!settings.ignoreCameraFollowPlayer && <div className="cursor centered absolute">+</div>}
      <TextureSelector activeTextureREF={activeTextureREF} />
      <PlayerList />
      <Chat />
      <Inventory />
      <PauseOverlay />
    </>
  );
};

export default CoreGame;
