import { Effects } from "@react-three/drei";
import { useThree, extend, useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { RenderPixelatedPass } from "three-stdlib";
import * as THREE from "three";
import { Player } from "./Player";
import { OtherPlayers } from "./OtherPlayers";
import settings from "../devOnline";
import { Cubes } from "./cubecomps/Cubes";
import { useRef } from "react";

extend({ RenderPixelatedPass });

export const Scene = ({ activeTextureREF, updateInitStatus,addonechunkmade, initStatus,chunksmadecounter,moveBools}) => {
  // console.log("----this is scene");
  const { size, scene, camera } = useThree();
  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size]);
  const REF_ALLCUBES = useRef({ "0.0.0": { pos: [0, 0, 0], texture: "log" } });

  const lookatatinit = useRef(true);

  /*
    adjusting camera: to help see a larger amount of cubes from different views
  */
  // useFrame((state) => {
  //   if (lookatatinit.current) {
  //     lookatatinit.current = false;
  //     state.camera.lookAt(20, -5, 20);

  //   }
  // });

  return (
    <>
      {settings.hidePlayer ? <></> : <Player moveBools={moveBools} />}
      {/* {settings.hideOtherPlayers ? <></> : <OtherPlayers />} */}
      {settings.hideCubes ? <></> : <Cubes activeTextureREF={activeTextureREF} REF_ALLCUBES={REF_ALLCUBES} updateInitStatus={updateInitStatus} addonechunkmade={addonechunkmade} initStatus={initStatus} chunksmadecounter={chunksmadecounter}/>}
      {/* <Effects>
                <renderPixelatedPass args={[resolution, 6, scene, camera, { normalEdgeStrength: 1, depthEdgeStrength: 1 }]} />
            </Effects> */}
    </>
  );
};
