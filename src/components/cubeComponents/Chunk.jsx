import { useFrame, useThree } from "@react-three/fiber";
import { FormCubeArrays } from "./FormCubeArrays";
import * as THREE from "three";
import { useRef } from "react";
import { useState } from "react";
import settings from "../../constants";

export const Chunk = ({chunkNum,activeTextureREF,chunkProps,REF_ALLCUBES,addWorkerJob}) => {
  const { camera, scene } = useThree();
  const chunkTrackBlockCount = useRef(0);
  const chunkTrackVisibility = useRef(false);
  const [updateChunk, setUpdateChunk] = useState(false);
  let firstPass = useRef(true);

  function makeKey(x, y, z) {
    return x + "." + y + "." + z;
  }

  function clickCubeFace(e) {
    e.stopPropagation();
    console.log({which:e.which})
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if(!settings.movewithJOY_BOOL){
      mouse.x = (.5) * 2 - 1;
      mouse.y = -(.5) * 2 + 1;
    }

    raycaster.setFromCamera(mouse, camera);

    let intersect = raycaster.intersectObjects(scene.children);

    intersect = intersect.filter((inter) => {
      return inter.object.name == "cubesMesh2";
    });

    if (intersect.length > 0) {
      let currBlocks = REF_ALLCUBES.current;
      let faceNormal=[intersect[0].face.normal.x,intersect[0].face.normal.y,intersect[0].face.normal.z]
      let contactBlock = [...intersect[0].point].map((val,ind)=>{
        return Math.round(val+.000002*faceNormal[ind]*-1)
      })

      let currTexture = activeTextureREF.current;

      if (e.which === 1) {
        let blockToAdd = contactBlock.map((val,ind)=>{
          return val+faceNormal[ind]
        })
        let newblock = {
          key:makeKey(...blockToAdd),
          pos:blockToAdd
        }
        currBlocks[newblock.key] = { pos: newblock.pos, texture: currTexture };
        chunkProps.current[chunkNum].keys.push(newblock.key);
        chunkProps.current[chunkNum].count++;
        REF_ALLCUBES.current = currBlocks;
      }

      if (e.which === 3) {
        let remove = makeKey(...contactBlock)
        delete currBlocks[remove];
        REF_ALLCUBES.current = currBlocks;
        let r_index = chunkProps.current[chunkNum].keys.indexOf(remove);
        chunkProps.current[chunkNum].keys[r_index] =
          chunkProps.current[chunkNum].keys[chunkProps.current[chunkNum].keys.length - 1];
        chunkProps.current[chunkNum].keys.length--;
        chunkProps.current[chunkNum].count--;
      }
    }
  }

  useFrame(() => {
    if (chunkProps.current[chunkNum].count != chunkTrackBlockCount.current) {
      chunkTrackBlockCount.current = chunkProps.current[chunkNum].count;
      if (firstPass.current) {
        firstPass.current = false;
      } else {
        addWorkerJob(chunkNum, "user");
      }
    }
    if (chunkProps.current[chunkNum].draw.rere) {
      chunkProps.current[chunkNum].draw.rere = false;
      setUpdateChunk(!updateChunk); //triggers a rerender
    }
    if (chunkProps.current[chunkNum].visible != chunkTrackVisibility.current) {
      chunkTrackVisibility.current = chunkProps.current[chunkNum].visible;
      setUpdateChunk(!updateChunk);
    }
  });

  function handleEmpty() {
    if (chunkTrackBlockCount.current > 0 && chunkProps.current[chunkNum].visible) {
      return (
        <FormCubeArrays chunkNum={chunkNum} chunkProps={chunkProps.current[chunkNum]} clickCubeFace={clickCubeFace} />
      );
    } else {
      return <></>;
    }
  }

  return handleEmpty();
};
