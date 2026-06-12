import { allMincraftTexture } from "../../images/textures";

function BufferAttributes({ set }) {
  return (
    <bufferGeometry>
      <bufferAttribute
        attach="attributes-position"
        array={set.vertices}
        count={set.vertices.length / 3}
        itemSize={3}
      />
      <bufferAttribute
        attach="attributes-uv"
        array={set.uvs}
        count={set.uvs.length / 2}
        itemSize={2}
      />
      <bufferAttribute
        attach="attributes-normal"
        array={set.normals}
        count={set.normals.length / 3}
        itemSize={3}
      />
      <bufferAttribute
        attach="attributes-color"
        array={set.colors}
        count={set.colors.length / 3}
        itemSize={3}
      />
    </bufferGeometry>
  );
}

export const DrawCubesGeo = ({ info, clickCubeFace }) => {
  return (
    <>
      {info.solid.vertices.length > 0 && (
        <mesh onPointerDown={clickCubeFace} name="cubesMesh2">
          <BufferAttributes set={info.solid} />
          <meshStandardMaterial
            attach="material"
            map={allMincraftTexture}
            vertexColors
          />
        </mesh>
      )}
      {info.trans.vertices.length > 0 && (
        <mesh name="cubesMeshWater">
          <BufferAttributes set={info.trans} />
          <meshStandardMaterial
            attach="material"
            color="#3f76e4"
            transparent
            opacity={0.65}
            depthWrite={false}
            vertexColors
          />
        </mesh>
      )}
    </>
  );
};
