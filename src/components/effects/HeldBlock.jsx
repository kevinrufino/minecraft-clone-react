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

  const bobAmp = useRef(0);

  // NOTE: must run AFTER the Player's useFrame has moved the camera or the
  // block trails the view by a frame (jitter). That ordering comes from
  // mounting HeldBlock after Scene in CoreGame -- do NOT use a useFrame
  // priority for this: any positive priority puts r3f into manual-render
  // mode and the whole canvas goes blank.
  useFrame((_, delta) => {
    if (!groupRef.current || !cubeRef.current) return;

    // Copy camera transform onto the group
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);

    // Walk bob
    const currentPos = camera.position;
    let speedX = 0;
    let speedZ = 0;
    if (prevPos.current && delta > 0) {
      speedX = (currentPos.x - prevPos.current.x) / delta;
      speedZ = (currentPos.z - prevPos.current.z) / delta;
    }
    prevPos.current = { x: currentPos.x, z: currentPos.z };

    const horizontalSpeed = Math.sqrt(speedX * speedX + speedZ * speedZ);
    // amplitude eases in/out instead of snapping when speed crosses the
    // threshold, which read as jitter
    const targetAmp = horizontalSpeed > 0.5 ? 1 : 0;
    bobAmp.current += (targetAmp - bobAmp.current) * Math.min(1, delta * 8);
    if (bobAmp.current > 0.01) {
      bobTime.current += delta * 8;
    }

    const bobY = Math.sin(bobTime.current) * 0.02 * bobAmp.current;
    const bobX = Math.cos(bobTime.current * 0.5) * 0.01 * bobAmp.current;

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
      {/* transparent so it draws in the same pass as water; renderOrder 999
          + no depth test keeps it on top even when looking at a lake */}
      <mesh ref={cubeRef} scale={0.4} renderOrder={999}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={tex} depthTest={false} transparent />
      </mesh>
    </group>
  );
}
