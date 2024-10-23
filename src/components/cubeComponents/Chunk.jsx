import { useFrame, useThree } from "@react-three/fiber";
import { FormCubeArrays } from "./FormCubeArrays";
import * as THREE from "three";
import { useRef } from "react";
import { useState } from "react";
import settings from "../../constants";

export const Chunk = ({
  chunkNum,
  activeTextureREF,
  chunkProps,
  REF_ALLCUBES,
  addWorkerJob,
}) => {
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
    console.log({ which: e.which });
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (!settings.movewithJOY_BOOL) {
      mouse.x = 0.5 * 2 - 1;
      mouse.y = -0.5 * 2 + 1;
    }

    raycaster.setFromCamera(mouse, camera);

    let intersect = raycaster.intersectObjects(scene.children);

    intersect = intersect.filter((inter) => {
      return inter.object.name == "cubesMesh2";
    });

    if (intersect.length > 0) {
      let currBlocks = REF_ALLCUBES.current;
      // console.log({intersect})
      // console.log({here:String([...intersect[0].point])})
      let faceNormal = [
        intersect[0].face.normal.x,
        intersect[0].face.normal.y,
        intersect[0].face.normal.z,
      ];
      let contactBlock = [...intersect[0].point].map((val, ind) => {
        return Math.round(val + 0.000002 * faceNormal[ind] * -1);
      });

      // let blockToAdd=[...intersect[0].point].map(val=>Math.round(val+.00002))
      // let blockToRemove=[blockToAdd[0]-faceNormal.x,blockToAdd[1]-faceNormal.y,blockToAdd[2]-faceNormal.z]
      // console.log({add:String(blockToAdd),rem:String(blockToRemove)})
      let f_Index = intersect[0].faceIndex;
      f_Index = f_Index - (f_Index % 2);

      let currTexture = activeTextureREF.current;

      if (e.which === 1) {
        // console.log("click 1 :", { f_Index });
        // let newblock = cubeFaceIndexesREF.current[chunkNum][f_Index].add;
        let blockToAdd = contactBlock.map((val, ind) => {
          return val + faceNormal[ind];
        });
        let newblock = {
          key: makeKey(...blockToAdd),
          pos: blockToAdd,
        };
        console.log({ newblcokey: newblock.key, newblock, currTexture });
        currBlocks[newblock.key] = { pos: newblock.pos, texture: currTexture };
        chunkProps.current[chunkNum].keys.push(newblock.key);
        chunkProps.current[chunkNum].count++;
        // console.log({currBlocks})
        REF_ALLCUBES.current = currBlocks;
      }

      if (e.which === 3) {
        // console.log("click 3 :", { f_Index });
        // let remove = cubeFaceIndexesREF.current[chunkNum][f_Index].remove;
        let remove = makeKey(...contactBlock);
        console.log({ remove });
        delete currBlocks[remove];
        REF_ALLCUBES.current = currBlocks;
        let r_index = chunkProps.current[chunkNum].keys.indexOf(remove);
        chunkProps.current[chunkNum].keys[r_index] =
          chunkProps.current[chunkNum].keys[
            chunkProps.current[chunkNum].keys.length - 1
          ];
        chunkProps.current[chunkNum].keys.length--;
        chunkProps.current[chunkNum].count--;
      }
    }
  }

  function makeKey(x, y, z) {
    return x + "." + y + "." + z;
  }

  useFrame(() => {
    if (chunkProps.current[chunkNum].count != chunkTrackBlockCount.current) {
      // console.log(`chunknum:${chunkNum} - totalcubes:${chunkProps.current[chunkNum].count} `)
      chunkTrackBlockCount.current = chunkProps.current[chunkNum].count;
      if (firstPass.current) {
        // console.log("first pass")
        firstPass.current = false;
      } else {
        // console.log("adding worker job")
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
    if (
      chunkTrackBlockCount.current > 0 &&
      chunkProps.current[chunkNum].visible
    ) {
      return (
        <FormCubeArrays
          chunkNum={chunkNum}
          chunkProps={chunkProps.current[chunkNum]}
          clickCubeFace={clickCubeFace}
        />
      );
    } else {
      return <></>;
    }
  }

  return handleEmpty();
};
