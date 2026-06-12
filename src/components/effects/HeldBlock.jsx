import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  dirtTexture,
  grassTexture,
  glassTexture,
  woodTexture,
  logTexture,
} from "../../images/textures";
import { useStore } from "../../hooks/useStore";

const TEXTURE_MAP = {
  dirt: dirtTexture,
  grass: grassTexture,
  glass: glassTexture,
  wood: woodTexture,
  log: logTexture,
};

export function HeldBlock() {
  const { camera } = useThree();
  const [texture] = useStore((s) => [s.texture]);

  const groupRef = useRef();
  const cubeRef = useRef();
  const prevPos = useRef(null);
  const bobTime = useRef(0);
  const swingRef = useRef(0);

  const tex = useMemo(() => TEXTURE_MAP[texture] || dirtTexture, [texture]);

  useEffect(() => {
    const onPointerDown = () => {
      swingRef.current = 1;
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || !cubeRef.current) return;

    // Copy camera transform onto the group
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);

    // Walk bob
    const currentPos = camera.position;
    let speedX = 0;
    let speedZ = 0;
    if (prevPos.current) {
      speedX = (currentPos.x - prevPos.current.x) / delta;
      speedZ = (currentPos.z - prevPos.current.z) / delta;
    }
    prevPos.current = { x: currentPos.x, z: currentPos.z };

    const horizontalSpeed = Math.sqrt(speedX * speedX + speedZ * speedZ);
    if (horizontalSpeed > 0.5) {
      bobTime.current += delta * 10;
    }

    const bobY = Math.sin(bobTime.current) * 0.02;
    const bobX = Math.cos(bobTime.current * 0.5) * 0.01;

    // Swing animation
    swingRef.current = Math.max(0, swingRef.current - delta * 4);
    const swing = swingRef.current;

    // Apply position and rotation to the cube (local space)
    cubeRef.current.position.set(
      0.45 + bobX,
      -0.38 + bobY,
      -0.8 - swing * 0.15
    );
    cubeRef.current.rotation.set(0.1 - swing * 0.5, -0.4, 0);
  });

  return (
    <group ref={groupRef}>
      <mesh ref={cubeRef} scale={0.4} renderOrder={999}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={tex} depthTest={false} />
      </mesh>
    </group>
  );
}
