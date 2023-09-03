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

function App() {
  console.log("-------- rerender App");
  const [establishedConn] = useStore((state) => [state.establishedConn]);
  const activeTextureREF = useRef("dirt");

  const chunksmadecounter = useRef({loaddone:false , track:{} })
  const loadingscreenhtml= useRef()
  const [initStatus,setInitStatus] = useState({
    buildWorkers:0,
    initWorkers:0,
    initWorld:0,
  })

  let moveBools=useRef({
    moveBackward:false,
    moveForward:false,
    moveLeft:false,
    moveRight:false,
    jump:false,
    moveQuick:false,
    moveQuickTC:0, //tap count
    moveQuickTT:0, //tap time
    jumpTT:0,
    jumpTC:0,
    camUp:false,
    camDown:false,
    camLeft:false,
    camRight:false,
})

  function updateInitStatus(obj){ 
    setInitStatus({...initStatus.current,...obj})
  }

  function addonechunkmade(num){
    let max = settings.FullWorldChunkSideLength**2
    chunksmadecounter.current.track[num]=true
    let madecount=Object.keys(chunksmadecounter.current.track).length

    if(3<=madecount && !chunksmadecounter.current.loaddone){
    chunksmadecounter.current.loaddone=true
    }
    
    if(loadingscreenhtml.current){
      loadingscreenhtml.current.textContent=`${madecount}/${max}`
    }

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

  function goToGame() {
    return (
      <>
        <LoadingWorldPage buildWorkers={initStatus.buildWorkers} chunksmadecounter={chunksmadecounter} />
        <Canvas>
          {settings.hideSky ? <></> : <Sky name={"skyMesh"} sunPosition={[100, 100, 20]} />}
          <ambientLight intensity={0.5} />
          {settings.stopCursorCapture ? <></> : <FPV />}

          <Physics>
            {/* <Debug color="red" scale={1}  > */}
            <Scene activeTextureREF={activeTextureREF} updateInitStatus={updateInitStatus} initStatus={initStatus} addonechunkmade={addonechunkmade} chunksmadecounter={chunksmadecounter} moveBools={moveBools}/>
            {/* </Debug> */}
          </Physics>

          {settings.useOrbitals ? <OrbitControls   /> : <></>}
          <axesHelper name={"axesHelper"} scale={10} />
        </Canvas>
        {settings.ignoreCameraFollowPlayer ? <></> : <div className="cursor centered absolute">+</div>}
        {settings.hideUIContent ? (<></>) : (
          <>
            <Menu />
            <Help />
          </>
        )}

        {settings.hideTextSelect ? <></> : <TextureSelector activeTextureREF={activeTextureREF} />}
        <LowerControlStrip moveBools={moveBools} />
      </>
    );
  }

  function showtestor(){


    return <>
    <LowerControlStrip moveBools={moveBools} />
    </>

  }

  return establishedConn ? goToGame() : gettingWorldLoadScreen();
  // return showtestor();
}

export default App;
