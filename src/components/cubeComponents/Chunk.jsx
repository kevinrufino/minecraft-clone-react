import { useFrame, useThree } from "@react-three/fiber";
import { FormCubeArrays } from "./FormCubeArrays";
import * as THREE from "three";
import { useRef } from "react";
import { useState } from "react";
import settings from "../../constants";
import { makeKey } from "../../world/keys";

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

  function clickCubeFace(e) {
    e.stopPropagation();
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
      return inter.object.name === "cubesMesh2";
    });

    if (intersect.length > 0) {
      let currBlocks = REF_ALLCUBES.current;
      let faceNormal = [
        intersect[0].face.normal.x,
        intersect[0].face.normal.y,
        intersect[0].face.normal.z,
      ];
      let contactBlock = [...intersect[0].point].map((val, ind) => {
        return Math.round(val + 0.000002 * faceNormal[ind] * -1);
      });

      let currTexture = activeTextureREF.current;

      if (e.button === 0) {
        let blockToAdd = contactBlock.map((val, ind) => {
          return val + faceNormal[ind];
        });
        let newblock = {
          key: makeKey(...blockToAdd),
          pos: blockToAdd,
        };
        currBlocks[newblock.key] = { pos: newblock.pos, texture: currTexture };
        chunkProps.current[chunkNum].keys.push(newblock.key);
        chunkProps.current[chunkNum].count++;
      }

      if (e.button === 2) {
        const remove = makeKey(...contactBlock);
        if (!(remove in currBlocks)) {
          return;
        }
        delete currBlocks[remove];
        const keys = chunkProps.current[chunkNum].keys;
        const r_index = keys.indexOf(remove);
        if (r_index !== -1) {
          keys[r_index] = keys[keys.length - 1];
          keys.pop();
        }
        chunkProps.current[chunkNum].count--;
      }
    }
  }

  useFrame(() => {
    if (chunkProps.current[chunkNum].count !== chunkTrackBlockCount.current) {
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
    if (chunkProps.current[chunkNum].visible !== chunkTrackVisibility.current) {
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
