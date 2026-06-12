import { allMincraftTexture } from "../../images/textures";

export const DrawCubesGeo = ({ info, clickCubeFace }) => {
  return (
    <mesh onPointerDown={clickCubeFace} name="cubesMesh2">
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={info.vertices}
          count={info.vertices.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-uv"
          array={info.uvs}
          count={info.uvs.length / 2}
          itemSize={2}
        />
        <bufferAttribute
          attach="attributes-normal"
          array={info.normals}
          count={info.normals.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <meshStandardMaterial attach="material" map={allMincraftTexture} />
    </mesh>
  );
};
