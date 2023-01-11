import { useEffect, useState } from "react";
import { useRef } from "react";
import * as textures from "../../images/textures";
import settings from "../../devOnline";
import { DrawCubesRB } from "./DrawCubesRB";

export const DrawCubesGeo = ({ info, clickCubeFace }) => {
  const cubeTextures = textures["allMincraftTexture"];

  const theMeshRef = useRef();
  const [readyForRigidBody, setReadyForRigidBody] = useState(false);

  function drawGeo() {
    return (
      <mesh ref={theMeshRef} onClick={clickCubeFace} onContextMenu={clickCubeFace} name="cubesMesh2">
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={info.vertices}
            count={info.vertices.length / 3}
            itemSize={3}
          />
          <bufferAttribute attach="attributes-uv" array={info.uvs} count={info.uvs.length / 2} itemSize={2} />
          <bufferAttribute
            attach="attributes-normal"
            array={info.normals}
            count={info.normals.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <meshStandardMaterial attach="material" map={cubeTextures} />
      </mesh>
    );
  }

  useEffect(() => {
    //this is neccessary so that after theMeshRef is set, rigid bodies can be placed
    if (theMeshRef.current) {
      if (!readyForRigidBody) {
        setReadyForRigidBody(true);
      }
    }
  }, [theMeshRef.current]);

  function drawRigid() {
    if (theMeshRef.current) {
      return <DrawCubesRB orig_geo={theMeshRef.current.geometry} />;
    }
  }

  return (
    <>
      {drawGeo()}
      {settings.ignoreCubeRigidBody ? <></> : drawRigid()}
    </>
  );
};
