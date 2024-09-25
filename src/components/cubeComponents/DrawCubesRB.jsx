import { useConvexPolyhedron } from "@react-three/cannon";
import { Geometry } from "three-stdlib";

export const DrawCubesRB = ({ orig_geo }) => {
  function toConvexProps(bufferGeometry) {
    const geo = new Geometry().fromBufferGeometry(bufferGeometry);
    return [geo.vertices.map((v) => [v.x, v.y, v.z]), geo.faces.map((f) => [f.a, f.b, f.c]), []];
  }

  const [ref, api] = useConvexPolyhedron(() => ({ mass: 0, args: toConvexProps(orig_geo) }));

  return <></>;
};
