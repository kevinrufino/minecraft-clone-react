import { Debug, Physics } from "@react-three/cannon";
import { Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { FPV } from "./components/FPV";
import { TextureSelector } from "./components/TextureSelector";
import { Menu } from "./components/Menu";
import { Help } from "./components/Help";
import { Scene } from "./components/Scene";
import io from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "./hooks/useStore";
import settings from "./devOnline";
import { OrbitControls } from "@react-three/drei";
import { ShowAll } from "./helpkev/ShowAll";


const ENDPOINT = settings.herokuserver ? "https://ghk-cpminecraft.herokuapp.com/" : "http://localhost:5000";
// const ENDPOINT = settings.herokuserver?'https://ghk-reactminecraftcloneserver.onrender.com':"http://localhost:5000"

function App() {
  const [greg_Addsocket, socket, online_updateCubes, online_setplayerNum, online_setPlayersPos, playernum] = useStore(
    (state) => [
      state.online_Addsocket,
      state.socket,
      state.online_updateCubes,
      state.online_setplayerNum,
      state.online_setPlayersPos,
      state.playernum,
    ]
  );

  const [conn, setConn] = useState(false);
  const activeTexturePatchFix = useRef('dirt')

  useEffect(() => {
    if (settings.online) {
      if (socket) {
        console.log("HELLO?", socket.connected);

        socket.on("S_GiveWorld", (world) => {
          console.log("given world: ", world);
          online_updateCubes(world.cubes);
          online_setPlayersPos(world.players);
          setConn(true);
        });
        socket.on("S_GiveplayerNum", (pnum) => {
          console.log("given pnum; ", pnum);
          online_setplayerNum(pnum);
        });
        socket.on("S_HeartBeat", (world) => {
          online_updateCubes(world.cubes);
          online_setPlayersPos(world.players);
        });
      }
    }

    if (!settings.online && !conn) {
      setConn(true);
    }
  }, [socket]);

  //making connection
  useEffect(() => {
    if (settings.online) {
      const connectionOptions = {
        forceNew: true,
        reconnectionAttempts: "5",
        timeout: 10000,
        transports: ["websocket"],
      };
      const newSocket = io.connect(ENDPOINT, connectionOptions);
      console.log("newsocket", newSocket);
      greg_Addsocket(newSocket);

      return () => {
        if (playernum) {
          let params = {
            worldname: null,
            playernum,
          };
          if (socket) {
            // if(socket.connected){
            socket.emit("C_RemovePlayer", params);
            // }
          }
        }
        newSocket.close(); //this is the clean up function
      };
    }
  }, []);

  // const cubeFaceIndexesREF = useRef();

  function goToGame() {
    return (
      <>
        <Canvas camera={{ position: [-5, 5, -5] }}>
          <Sky name={'skyMesh'} sunPosition={[100, 100, 20]}/>
          <ambientLight intensity={0.5} />
          {settings.hidePlayer?<></>:<FPV />}
          <Physics>
            {/* <Debug color="red" scale={1}  > */}
            <Scene activeTexturePatchFix={activeTexturePatchFix} />
            {/* </Debug> */}
          </Physics>
          {settings.useOrbitals ? <OrbitControls /> : <></>}
          <axesHelper name={"axesHelper"} scale={10} />
        </Canvas>
        {settings.ignoreCameraFollowPlayer?<></>:<div className="cursor centered absolute">+</div>}
        {settings.hideUIContent ? (
          <></>
        ) : (
          <>
            <Menu />
            <Help />
          </>
        )}

        {settings.hideTextSelect ? <></> : <TextureSelector activeTexturePatchFix={activeTexturePatchFix} />}
      </>
    );
  }

  function gettingWorld() {
    return (
      <>
        <div>gettingWorld</div>
      </>
    );
  }

  function HelpKev() {
    let alldablocks = {
      'b1': { 'color':'red','dg': 0 },
      'b2': { 'color':'yellow','dg': 90 },
      'b3': { 'color':'blue','dg': 180 },
      'b4': { 'color':'white','dg': 270 },
    };

    return (
      <>
        <Canvas camera={{"position":[10,3,0]}}>
          <ambientLight intensity={0.5} />
          {/* <ClickWatch /> */}

          <Physics>
            <Debug color="red" scale={1}>
              <ShowAll myArgs={alldablocks} />
            </Debug>
          </Physics>

          <OrbitControls />
          <axesHelper name={"axesHelper"} scale={10} />
        </Canvas>
      </>
    );
  }

  return (
    conn? goToGame() : gettingWorld()

    // HelpKev()
  );
}

export default App;
