import { useEffect } from "react";
import settings from "../constants";
import { useStore } from "./useStore";
import { applyRemoteBlockEvent } from "../world/remoteBlocks";
import { clearEdits } from "../world/edits";
import io from "socket.io-client";

// Server code lives at https://github.com/GreyDaCaLa/ReactMineCraftCloneServer
// (5050 because macOS AirPlay squats on port 5000)
const ENDPOINT = settings.useRemoteServer
  ? "https://ghk-reactminecraftcloneserver.onrender.com"
  : "http://localhost:5050";

// if the server can't be reached in this window, start the game offline
const OFFLINE_FALLBACK_MS = 6000;

// Module-level singleton: React StrictMode double-mounts effects, and two
// sockets means the server sees a ghost player. One socket per page, period.
let sharedSocket = null;

function connectSocket() {
  if (sharedSocket) {
    return sharedSocket;
  }

  const store = useStore.getState();
  sharedSocket = io.connect(ENDPOINT, {
    forceNew: true,
    reconnectionAttempts: 5,
    timeout: 10000,
    transports: ["websocket"],
  });

  sharedSocket.on("S_GiveWorld", (world) => {
    // replay every block edit made before we joined
    (world.cubes || []).forEach((cube) => {
      applyRemoteBlockEvent({
        type: "add",
        pos: cube.pos,
        texture: cube.texture,
      });
    });
    (world.removed || []).forEach((pos) => {
      applyRemoteBlockEvent({ type: "remove", pos });
    });
    store.online_setPlayersPos(world.players);
    store.online_SetEstablishedConn(true);
  });
  sharedSocket.on("S_GiveplayerNum", (pnum) => {
    store.online_setplayerNum(pnum);
    sharedSocket.emit("C_SetName", {
      worldname: null,
      name: settings.playerName,
    });
  });
  sharedSocket.on("S_HeartBeat", (world) => {
    useStore.getState().online_setPlayersPos(world.players);
  });
  sharedSocket.on("S_BlockAdded", ({ pos, texture }) => {
    applyRemoteBlockEvent({ type: "add", pos, texture });
  });
  sharedSocket.on("S_BlockRemoved", ({ pos }) => {
    applyRemoteBlockEvent({ type: "remove", pos });
  });
  sharedSocket.on("S_BlocksReset", () => {
    clearEdits();
    window.location.reload();
  });
  // chat relayed from other players (server contract: broadcast to everyone
  // except the sender, who already sees their own message optimistically)
  sharedSocket.on("S_chat", ({ name, text }) => {
    if (typeof text === "string" && text.length) {
      useStore.getState().online_pushChat(name || "Player", text);
    }
  });

  // no server? fall back to single player instead of waiting forever
  setTimeout(() => {
    if (!useStore.getState().establishedConn) {
      console.warn(`No multiplayer server at ${ENDPOINT}, starting offline.`);
      settings.onlineEnabled = false;
      sharedSocket.close();
      useStore.getState().online_SetEstablishedConn(true);
    }
  }, OFFLINE_FALLBACK_MS);

  store.online_Addsocket(sharedSocket);
  return sharedSocket;
}

// Opens the socket.io connection and keeps player/world state in the store.
// `start` is false until the player picks a game mode on the title screen.
// When online play is disabled this just marks the connection as established
// so the game can proceed.
export function useOnlineConnection(start) {
  const establishedConn = useStore((state) => state.establishedConn);

  useEffect(() => {
    if (!start) {
      return;
    }
    if (settings.onlineEnabled) {
      connectSocket();
    } else if (!useStore.getState().establishedConn) {
      useStore.getState().online_SetEstablishedConn(true);
    }
    // the server removes our player on disconnect, so no unmount cleanup needed
  }, [start]);

  return establishedConn;
}
