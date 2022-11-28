import { Physics } from '@react-three/cannon';
import { Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { FPV } from './components/FPV';
import { TextureSelector } from './components/TextureSelector';
import { Menu } from './components/Menu'
import { Help } from './components/Help';
import { Scene } from './components/Scene';
import io from 'socket.io-client'
import { useEffect, useState } from 'react';
import { useStore } from './hooks/useStore';
import settings from './devOnline';

// const ENDPOINT = (false)?'https://connect4x4-server.herokuapp.com/':"http://localhost:5000"
const ENDPOINT = "http://localhost:5000"

function App() {
  const [greg_Addsocket,socket,online_updateCubes,online_setplayerNum,online_setPlayersPos] = useStore ((state) => [state.online_Addsocket,state.socket,state.online_updateCubes,state.online_setplayerNum,state.online_setPlayersPos])

  // const [socket,setSocket] =useState();
  const [conn,setConn] = useState(false);
  
  useEffect(()=>{
    console.log("#####-----##### SocketProvider 1 ")
    console.log("socket: ",socket)
    // console.log("the cubes: ",cubes)
    
    if(settings.online){
      if(socket){
        console.log("HELLO?",socket.connected)
          
          socket.on('S_GiveWorld',(world)=>{
            console.log("given world: ",world)
            online_updateCubes(world.cubes)
            online_setPlayersPos(world.players)
            setConn(true)
          });
          // socket.on('S_WorldUpdateCubes',(cubes)=>{
          //   console.log("cubes: ",cubes)
          //   online_updateCubes(cubes)
          // });
          socket.on('S_GiveplayerNum',(pnum)=>{
            console.log("given pnum; ",pnum)
            online_setplayerNum(pnum)
          });
          socket.on('S_HeartBeat',(world)=>{
            online_updateCubes(world.cubes)
            online_setPlayersPos(world.players)
          })
        }
    }

    if(!settings.online && !conn){
      setConn(true)
    }
      
    },[socket])
    
    //making connection
    useEffect(()=>{
      console.log("#####-----##### SocketProvider 2 ")
      if(settings.online){
      
        const connectionOptions =  {
            "forceNew" : true,
            "reconnectionAttempts": "5", 
            "timeout" : 10000,                  
            "transports" : ["websocket"]
        }
        const newSocket = io.connect(ENDPOINT,connectionOptions);
        console.log("newsocket",newSocket)
        // setSocket(newSocket);
        greg_Addsocket(newSocket)
    
  
  
        return () => newSocket.close() //this is the clean up function
      }
    },[])


  function goToGame(){
    return(
      <>
      <Canvas>
        <Sky sunPosition={[100, 100, 20]}/>
        <ambientLight intensity={.5} />
        <FPV />
        <Physics>
          <Scene />
        </Physics>
      </Canvas>
      <div className='cursor centered absolute'>+</div>
      <TextureSelector />
      <Menu />
      <Help />
    </>
    )
  }

  function gettingWorld(){
    return(
      <>
      <div>
        gettingWorld
      </div>
      </>
    )
  }



  return (

    conn?
    goToGame()
    :
    gettingWorld()

  );
}

export default App;
