import { useSphere } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";

export const Basicplayer = ({ mypos }) => {
  const [ref, api] = useSphere(() => ({
    mass: 0,
    args: [1],

    position: mypos,
  }));

  return (
    <>
      <mesh position={mypos}>
        <sphereGeometry attach="geometry" args={[1]} />
        <meshStandardMaterial attach="material" color="red" />
      </mesh>
    </>
  );
};
