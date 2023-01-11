import { useBox, usePlane } from "@react-three/cannon";
import { useStore } from "../hooks/useStore";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as textures from "../images/textures";

export const Ground = ({ sizeX = 5, sizeZ = 5, heightY = -0.5 }) => {
  const [getAllBlocks, updateAllBlocks] = useStore((state) => [state.getAllBlocks, state.updateAllBlocks]);
  const AMT = textures["allMincraftTexture"];
  const uvSize = 1 / 2 / 2 / 2 / 2;
  const uvL = (textures["AMTmap"]["bedrock"][0] - 1) * uvSize;
  const uvB = (textures["AMTmap"]["bedrock"][1] - 1) * uvSize;

  const [ref, api] = useBox(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    args: [sizeX, sizeZ, 0.1],
    position: [sizeX / 2 - 0.5, -0.6, sizeZ / 2 - 0.5],
  }));

  const { camera, scene } = useThree();

  function makeKey(x, y, z) {
    return x + "." + y + "." + z;
  }

  function clickGroundFace(e) {
    e.stopPropagation(); //click cannot be passed through the ground

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let intersect = raycaster.intersectObjects(scene.children);

    intersect = intersect.filter((inter) => {
      return inter.object.name == "groundMesh";
    });

    if (intersect.length > 0) {
      let f_Index = intersect[0].faceIndex;
      f_Index = f_Index - (f_Index % 2);

      let currblocks = getAllBlocks();
      let nbX = Math.floor((f_Index + 1) / (sizeZ * 2));
      let nbZ = Math.floor((f_Index + 1 - nbX * sizeZ * 2) / 2);
      if (!currblocks[makeKey(nbX, 0, nbZ)]) {;
        currblocks[makeKey(nbX, 0, nbZ)] = { pos: [nbX, 0, nbZ], texture: "sand" };
        updateAllBlocks(currblocks);
      }
    }

    // }
  }

  function setupInitalRendor() {
    let t = 0.5;
    let vertices = [];
    let uvs = [];
    let normals = [];

    const y = heightY;
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        vertices.push(x + t,y,z + t,x + t,y,z - t,x - t,y,z + t,x - t,y,z + t,x + t,y,z - t,x - t,y,z - t );
        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        uvs.push(
          uvL + uvSize,
          uvB + 0,
          uvL + uvSize,
          uvB + uvSize,
          uvL + 0,
          uvB + 0,
          uvL + 0,
          uvB + 0,
          uvL + uvSize,
          uvB + uvSize,
          uvL + 0,
          uvB + uvSize
        );
      }
    }

    return (
      <>
        <mesh name="groundMesh" matrixWorldAutoUpdate={false} onClick={clickGroundFace} onContextMenu={clickGroundFace}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array(vertices)}
              count={vertices.length / 3}
              itemSize={3}
            />
            <bufferAttribute attach="attributes-uv" array={new Float32Array(uvs)} count={uvs.length / 2} itemSize={2} />
            <bufferAttribute
              attach="attributes-normal"
              array={new Float32Array(normals)}
              count={normals.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <meshStandardMaterial attach="material" map={AMT} />
        </mesh>
      </>
    );
  }

  return setupInitalRendor();
};
