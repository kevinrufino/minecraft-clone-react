import { Effects } from "@react-three/drei";
import { useThree, extend, useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { RenderPixelatedPass } from "three-stdlib";
import * as THREE from "three";
import { Player } from "./Player";
import { Ground } from "./Ground";
import { OtherPlayers } from "./OtherPlayers";
import settings from "../devOnline";
import { FormCubeArrays } from "./cubecomps/FormCubeArrays";
import { Cubes } from "./cubecomps/Cubes";
import { useRef } from "react";


extend({ RenderPixelatedPass });

export const Scene = ({ activeTextureREF }) => {
  console.log('----this is scene')
  const { size, scene, camera } = useThree();
  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size]);
  const REF_ALLCUBES = useRef({"0.0.0": { pos: [0, 0, 0], texture: "log" }} )




  //adjusting camera
  useFrame((state)=>{

    //larger birds eye
    // state.camera.lookAt(20,0,20)
    // state.camera.position.lerp(new THREE.Vector3(1,500,1),1)
    
    //slant birds eye
    // state.camera.lookAt(500,0,500)
    // state.camera.position.lerp(new THREE.Vector3(-5,10,-5),1)



  })




  return (
    <>
    {/* {console.log('cubes',activeTextureREF)} */}
      {settings.hidePlayer ? <></> : <Player />}
      {settings.hideOtherPlayers ? <></> : <OtherPlayers />}
      {settings.hideCubes ? <></> : <Cubes activeTextureREF={activeTextureREF} REF_ALLCUBES={REF_ALLCUBES} />}
      {settings.hideGround ? <></> : <Ground activeTextureREF={activeTextureREF} />}
      {/* <Effects>
                <renderPixelatedPass args={[resolution, 6, scene, camera, { normalEdgeStrength: 1, depthEdgeStrength: 1 }]} />
            </Effects> */}
    </>
  );
};
