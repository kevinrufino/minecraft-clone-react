import { useState, useRef } from "react";
import { Player } from "./playerComponents/Player";
import { OtherPlayers } from "./playerComponents/OtherPlayers";
import settings from "../constants";
import { Cubes } from "./cubeComponents/Cubes";
import { chunkIdFromPosition } from "../world/chunkMath";

function setupPlayerStartingPosition() {
  let sp = settings.startingPositionDefault;
  if (settings.randomizeStartPos) {
    const fulllength =
      settings.worldSettings.chunkSize * settings.worldSettings.worldSize;
    sp = [fulllength / 2, settings.startingPositionDefault[1], fulllength / 2];
    settings.startingChunk = chunkIdFromPosition(
      sp[0],
      sp[2],
      settings.worldSettings,
    );
  }
  return sp;
}

export const Scene = ({
  activeTextureREF,
  updateInitStatus,
  chunksMadeCounter,
  moveBools,
}) => {
  const REF_ALLCUBES = useRef({});
  const [playerStartPos] = useState(setupPlayerStartingPosition);

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
          chunksMadeCounter={chunksMadeCounter}
        />
      )}
    </>
  );
};
