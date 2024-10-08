import { useEffect } from "react";
import settings from "../../constants";
import { useStore } from "../../hooks/useStore";
import io from "socket.io-client";

const ENDPOINT = settings.herokuServer
  ? "https://ghk-cpminecraft.herokuapp.com/"
  : "http://localhost:5000";
// const ENDPOINT = settings.herokuServer?'https://ghk-reactminecraftcloneserver.onrender.com':"http://localhost:5000"

//@TODO: this should be a hook since we're only using hooks in it.
export const MakeOnlineConnection = () => {
  const [
    establishedConn,
    online_SetEstablishedConn,
    greg_Addsocket,
    socket,
    online_updateCubes,
    online_setplayerNum,
    online_setPlayersPos,
    playernum,
  ] = useStore((state) => [
    state.establishedConn,
    state.online_SetEstablishedConn,
    state.online_Addsocket,
    state.socket,
    state.online_updateCubes,
    state.online_setplayerNum,
    state.online_setPlayersPos,
    state.playernum,
  ]);

  useEffect(() => {
    if (settings.onlineEnabled) {
      if (socket) {
        socket.on("S_GiveWorld", (world) => {
          online_updateCubes(world.cubes);
          online_setPlayersPos(world.players);
          online_SetEstablishedConn(true);
        });
        socket.on("S_GiveplayerNum", (pnum) => {
          online_setplayerNum(pnum);
        });
        socket.on("S_HeartBeat", (world) => {
          online_updateCubes(world.cubes);
          online_setPlayersPos(world.players);
        });
      }
    }

    if (!settings.onlineEnabled && !establishedConn) {
      online_SetEstablishedConn(true);
    }
  }, [socket]);

  //making connection
  useEffect(() => {
    if (settings.onlineEnabled) {
      const connectionOptions = {
        forceNew: true,
        reconnectionAttempts: "5",
        timeout: 10000,
        transports: ["websocket"],
      };
      const newSocket = io.connect(ENDPOINT, connectionOptions);
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

  return <></>;
};
