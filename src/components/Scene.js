import { useEffect, useState } from "react";
import { Player } from "./playerComponents/Player";
import { OtherPlayers } from "./playerComponents/OtherPlayers";
import settings from "../constants";
import { Cubes } from "./cubeComponents/Cubes";
import { useRef } from "react";

export const Scene = ({
  activeTextureREF,
  updateInitStatus,
  addonechunkmade,
  initStatus,
  chunksMadeCounter,
  moveBools,
}) => {
  const REF_ALLCUBES = useRef({ "0.0.0": { pos: [0, 0, 0], texture: "log" } });
  const [playerStartPos, setPSP] = useState([0, 0, 0]);
  const [allSet, setAS] = useState(false);

  function setupPlayerStartingPosition() {
    let sp = settings.startingPositionDefault;
    let ws = settings.worldSettings.worldSize;
    let cs = settings.worldSettings.chunkSize;
    if (settings.randomizeStartPos) {
      let fulllength =
        settings.worldSettings.chunkSize * settings.worldSettings.worldSize;
      let worldCenter = [
        fulllength / 2,
        settings.startingPositionDefault[1],
        fulllength / 2,
      ];
      console.log({ worldCenter });
      sp = worldCenter;
      settings.startingChunk =
        ws * Math.floor(sp[0] / cs) + Math.floor(sp[2] / cs);
    }

    setPSP(sp);
  }

  useEffect(() => {
    if (playerStartPos[0] === 0) {
      setupPlayerStartingPosition();
    }
    if (playerStartPos[0] !== 0) {
      setAS(true);
    }
  }, [playerStartPos]);

  function show() {
    return (
      <>
        {settings.showPlayer && (
          <Player
            moveBools={moveBools}
            playerStartingPostion={playerStartPos}
            REF_ALLCUBES={REF_ALLCUBES}
          />
        )}
        {settings.showOtherPlayers && <OtherPlayers />}
        {settings.showCubes && (
          <Cubes
            activeTextureREF={activeTextureREF}
            REF_ALLCUBES={REF_ALLCUBES}
            updateInitStatus={updateInitStatus}
            addonechunkmade={addonechunkmade}
            initStatus={initStatus}
            chunksMadeCounter={chunksMadeCounter}
          />
        )}
      </>
    );
  }

  return allSet && show();
};
