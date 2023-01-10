import { Effects } from "@react-three/drei";
import { useThree, extend } from "@react-three/fiber";
import { useMemo } from "react";
import { RenderPixelatedPass } from "three-stdlib";
import * as THREE from "three";
import { Player } from "./Player";
import { Ground } from "./Ground";
import { OtherPlayers } from "./OtherPlayers";
import settings from "../devOnline";
import { FormCubeArrays } from "./cubecomps/FormCubeArrays";


extend({ RenderPixelatedPass });

export const Scene = ({ activeTextureREF }) => {
  const { size, scene, camera } = useThree();
  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size]);
  return (
    <>
      {settings.hidePlayer ? <></> : <Player />}
      {settings.hideOtherPlayers ? <></> : <OtherPlayers />}
      {settings.hideCubes ? <></> : <FormCubeArrays activeTextureREF={activeTextureREF} />}
      {settings.hideGround ? <></> : <Ground activeTextureREF={activeTextureREF} />}
      {/* <Effects>
                <renderPixelatedPass args={[resolution, 6, scene, camera, { normalEdgeStrength: 1, depthEdgeStrength: 1 }]} />
            </Effects> */}
    </>
  );
};
