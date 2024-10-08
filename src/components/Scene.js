import { useThree, extend, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { RenderPixelatedPass } from "three-stdlib";
import * as THREE from "three";
import { Player } from "./playerComponents/Player";
import { OtherPlayers } from "./playerComponents/OtherPlayers";
import settings from "../constants";
import { Cubes } from "./cubeComponents/Cubes";
import { useRef } from "react";

extend({ RenderPixelatedPass });

export const Scene = ({
  activeTextureREF,
  updateInitStatus,
  addonechunkmade,
  initStatus,
  chunksmadecounter,
  moveBools,
}) => {
  const { size, scene, camera } = useThree();
  const resolution = useMemo(
    () => new THREE.Vector2(size.width, size.height),
    [size],
  );
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
      let offsetx = 0;
      let offsetz = 0;
      sp = worldCenter;
      settings.startingChunk =
        ws * Math.floor(sp[0] / cs) + Math.floor(sp[2] / cs);
    }

    setPSP(sp);
  }

  useEffect(() => {
    if (playerStartPos[0] == 0) {
      setupPlayerStartingPosition();
    }
    if (playerStartPos[0] != 0) {
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
            chunksmadecounter={chunksmadecounter}
          />
        )}
      </>
    );
  }

  return allSet && show();
};
