import { useEffect } from "react";
import settings from "../constants";
import { useStore } from "./useStore";
import io from "socket.io-client";

// Server code lives at https://github.com/GreyDaCaLa/ReactMineCraftCloneServer
const ENDPOINT = settings.useRemoteServer
  ? "https://ghk-reactminecraftcloneserver.onrender.com"
  : "http://localhost:5000";

// Opens the socket.io connection and keeps player/world state in the store.
// When online play is disabled this just marks the connection as established
// so the game can proceed.
export function useOnlineConnection() {
  const [
    establishedConn,
    online_SetEstablishedConn,
    online_Addsocket,
    socket,
    online_setplayerNum,
    online_setPlayersPos,
    playernum,
  ] = useStore((state) => [
    state.establishedConn,
    state.online_SetEstablishedConn,
    state.online_Addsocket,
    state.socket,
    state.online_setplayerNum,
    state.online_setPlayersPos,
    state.playernum,
  ]);

  useEffect(() => {
    if (settings.onlineEnabled && socket) {
      //@TODO: world.cubes from the server is not merged into the chunk world yet
      socket.on("S_GiveWorld", (world) => {
        online_setPlayersPos(world.players);
        online_SetEstablishedConn(true);
      });
      socket.on("S_GiveplayerNum", (pnum) => {
        online_setplayerNum(pnum);
      });
      socket.on("S_HeartBeat", (world) => {
        online_setPlayersPos(world.players);
      });
    }

    if (!settings.onlineEnabled && !establishedConn) {
      online_SetEstablishedConn(true);
    }
  }, [socket]);

  //making connection
  useEffect(() => {
    if (!settings.onlineEnabled) {
      return;
    }

    const connectionOptions = {
      forceNew: true,
      reconnectionAttempts: "5",
      timeout: 10000,
      transports: ["websocket"],
    };
    const newSocket = io.connect(ENDPOINT, connectionOptions);
    online_Addsocket(newSocket);

    return () => {
      if (playernum && newSocket.connected) {
        newSocket.emit("C_RemovePlayer", { worldname: null, playernum });
      }
      newSocket.close();
    };
  }, []);

  return establishedConn;
}
