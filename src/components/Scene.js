import { useRef } from "react";
import { Player } from "./playerComponents/Player";
import { OtherPlayers } from "./playerComponents/OtherPlayers";
import settings from "../constants";
import { Cubes } from "./cubeComponents/Cubes";

export const Scene = ({
  activeTextureREF,
  updateInitStatus,
  chunksMadeCounter,
  moveBools,
}) => {
  const REF_ALLCUBES = useRef({});
  const playerStartPos = settings.startingPositionDefault;

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
          spawnPos={playerStartPos}
        />
      )}
    </>
  );
};
