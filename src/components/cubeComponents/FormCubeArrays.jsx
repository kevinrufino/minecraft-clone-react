import { DrawCubesGeo } from "./DrawCubesGeo";

export const FormCubeArrays = ({ chunkKey, clickCubeFace, chunkProps }) => {
  const draw = chunkProps.draw;
  if (!draw || !draw.solid) {
    return null;
  }

  return (
    <DrawCubesGeo
      info={draw}
      key={`ACmesh${draw.cc || 0}-${chunkKey}`}
      clickCubeFace={clickCubeFace}
    />
  );
};
