
import { useBox, useConvexPolyhedron } from "@react-three/cannon"
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { Geometry } from "three-stdlib";


export const DiffRigid =({orig_geo})=>{

  function toConvexProps(bufferGeometry) {
    // console.log('buffer',bufferGeometry)
    const geo = new Geometry().fromBufferGeometry(bufferGeometry);
    // console.log('example',[geo.vertices.map((v) => [v.x, v.y, v.z]), geo.faces.map((f) => [f.a, f.b, f.c]), []])
    return [geo.vertices.map((v) => [v.x, v.y, v.z]), geo.faces.map((f) => [f.a, f.b, f.c]), []]; // prettier-ignore
  }
  
  const [ref,api] = useConvexPolyhedron(() => ({ mass: 0, args:toConvexProps(orig_geo) }));

  function showrigid(){
  return (
      <mesh></mesh>
    );
  }



  return(
      <>
      {showrigid()}
      </>
  )

}