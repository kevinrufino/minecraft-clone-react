import { Debug, Physics } from "@react-three/cannon";
import { Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { FPV } from "./components/FPV";
import { TextureSelector } from "./components/TextureSelector";
import { Menu } from "./components/Menu";
import { Help } from "./components/Help";
import { Scene } from "./components/Scene";

import { useEffect, useRef, useState } from "react";
import { useStore } from "./hooks/useStore";
import settings from "./devOnline";
import { OrbitControls } from "@react-three/drei";
import { MakeOnlineConnection } from "./components/multiplayercomps/MakeOnlineConnection";
import { LoadingWorldPage } from "./components/LoadingWorldPage";
import JoyStick from "./hooks/Joystick";
import LowerControlStrip from "./hooks/LowerControlStrip";
import TitleConfig from "./components/TitleConfig";

function App() {
  // console.log("-------- rerender App");
  const movewithJOY_BOOL = true
  const [establishedConn] = useStore((state) => [state.establishedConn]);
  const activeTextureREF = useRef("dirt");

  const [playerConfigReady,setPCR] = useState(false)

  const chunksmadecounter = useRef({ loaddone: false, track: {count:0,max:settings.worldSettings.worldSize**2} });
  const loadingscreenhtml = useRef();
  const [initStatus, setInitStatus] = useState({
    buildWorkers: 0,
    initWorkers: 0,
    initWorld: 0,
  });

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

  function updateInitStatus(obj) {
    setInitStatus({ ...initStatus.current, ...obj });
  }

  function gettingWorldLoadScreen() {
    //this is meant to be a place holder for a potential loading screen as we generate enough of the world before the player.
    //also a waiting screen for when some one is waiting to connect to online server
    return (
      <>
        <div>gettingWorld</div>
        <MakeOnlineConnection />
      </>
    );
  }

  function playerGivenGameSettings(obj){
    console.log('from player given game settings')
    setPCR(true)

    
  }

  function goToGame() {
    if(playerConfigReady){
    // if(true){

      return (
        <>
          <LoadingWorldPage buildWorkers={initStatus.buildWorkers} chunksmadecounter={chunksmadecounter} myRef={loadingscreenhtml} />
          <Canvas>
            {settings.hideSky ? <></> : <Sky name={"skyMesh"} sunPosition={[100, 100, 20]} />}
            <ambientLight intensity={0.5} />

  
            <Physics>
              {/* <Debug color="red" scale={1}  > */}
              <Scene
                activeTextureREF={activeTextureREF}
                updateInitStatus={updateInitStatus}
                initStatus={initStatus}
                chunksmadecounter={chunksmadecounter}
                moveBools={moveBools}
                movewithJOY_BOOL={movewithJOY_BOOL}
              />
              {/* </Debug> */}
            </Physics>
  
            {settings.useOrbitals ? <OrbitControls /> : <></>}
            <axesHelper name={"axesHelper"} scale={10} />
          </Canvas>
          {settings.ignoreCameraFollowPlayer ? <></> : <div className="cursor centered absolute">+</div>}
          {settings.hideUIContent ? (
            <></>
          ) : (
            <>
              <Menu />
              <Help />
            </>
          )}
  
          {settings.hideTextSelect ? <></> : <TextureSelector activeTextureREF={activeTextureREF} />}
          {settings.movewithJOY_BOOL?<LowerControlStrip moveBools={moveBools} />:<></>}
        </>
      );
    }else{
      return(
        <>
        <TitleConfig playerGivenGameSettings={playerGivenGameSettings}/>
        </>
      )
    }
  }


  function testor() {
    return(<></>)
  }

  return establishedConn ? goToGame() : gettingWorldLoadScreen();
  // return testor();
}

export default App;
