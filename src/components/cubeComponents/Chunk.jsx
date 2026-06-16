import { useFrame, useThree } from "@react-three/fiber";
import { FormCubeArrays } from "./FormCubeArrays";
import * as THREE from "three";
import { useRef, useState } from "react";
import settings from "../../constants";
import { makeKey } from "../../world/keys";
import { useStore } from "../../hooks/useStore";
import { playPlace, playBreak } from "../../world/sound";

export const Chunk = ({
  chunkKey,
  activeTextureREF,
  chunkProps,
  REF_ALLCUBES,
  applyBlockChange,
}) => {
  const { camera, scene } = useThree();
  const chunkTrackVisibility = useRef(false);
  const [updateChunk, setUpdateChunk] = useState(false);
  const [online_addCube, online_removeCube] = useStore((state) => [
    state.online_addCube,
    state.online_removeCube,
  ]);

  function clickCubeFace(e) {
    // desktop play is driven by MiningController (hold-to-break + place);
    // this tap handler is only for touch/joystick devices
    if (!settings.movewithJOY_BOOL) {
      return;
    }
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
      const faceNormal = [
        intersect[0].face.normal.x,
        intersect[0].face.normal.y,
        intersect[0].face.normal.z,
      ];
      const contactBlock = [...intersect[0].point].map((val, ind) => {
        return Math.round(val + 0.000002 * faceNormal[ind] * -1);
      });

      if (e.button === 0) {
        const blockToAdd = contactBlock.map((val, ind) => {
          return val + faceNormal[ind];
        });
        const texture = activeTextureREF.current;
        // can't place a block inside yourself
        const [px, py, pz] = camera.position;
        if (
          Math.abs(blockToAdd[0] - px) < 0.8 &&
          Math.abs(blockToAdd[2] - pz) < 0.8 &&
          blockToAdd[1] > py - 2 &&
          blockToAdd[1] < py + 0.5
        ) {
          return;
        }
        applyBlockChange({ type: "add", pos: blockToAdd, texture });
        playPlace();
        if (settings.onlineEnabled) {
          online_addCube(blockToAdd, texture);
        }
      }

      if (e.button === 2) {
        const key = makeKey(...contactBlock);
        const block = REF_ALLCUBES.current[key];
        if (!block || block.texture === "bedrock") {
          return;
        }
        applyBlockChange({ type: "remove", pos: contactBlock });
        playBreak();
        if (settings.onlineEnabled) {
          online_removeCube(contactBlock);
        }
      }
    }
  }

  useFrame(() => {
    const chunk = chunkProps.current[chunkKey];
    if (!chunk) {
      return;
    }
    if (chunk.draw.rere) {
      chunk.draw.rere = false;
      setUpdateChunk(!updateChunk); //triggers a rerender
    }
    if (chunk.visible !== chunkTrackVisibility.current) {
      chunkTrackVisibility.current = chunk.visible;
      setUpdateChunk(!updateChunk);
    }
  });

  const chunk = chunkProps.current[chunkKey];
  if (!chunk || !chunk.visible || !chunk.count) {
    return null;
  }
  return (
    <FormCubeArrays
      chunkKey={chunkKey}
      chunkProps={chunk}
      clickCubeFace={clickCubeFace}
    />
  );
};
