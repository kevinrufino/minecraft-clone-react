import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";

// Remote player with smooth interpolation, blocky body, and name tag.
export const RemotePlayer = ({ mypos, name }) => {
  const groupRef = useRef();
  const targetPosRef = useRef(new THREE.Vector3(...mypos));
  const lerping = useRef(new THREE.Vector3(...mypos));

  // Initialize group position to first mypos so players don't fly in from origin.
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(targetPosRef.current);
      lerping.current.copy(targetPosRef.current);
    }
  }, []);

  // Update target position when mypos prop changes.
  useEffect(() => {
    targetPosRef.current.set(mypos[0], mypos[1], mypos[2]);
  }, [mypos[0], mypos[1], mypos[2]]);

  // Smooth interpolation in useFrame.
  useFrame((_, delta) => {
    if (groupRef.current) {
      const k = 1 - Math.pow(0.0001, delta);
      groupRef.current.position.lerp(targetPosRef.current, k);
    }
  });

  return (
    <group ref={groupRef} position={lerping.current}>
      {/* Head: 0.5×0.5×0.5 at y=0 (eye level) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry attach="geometry" args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial attach="material" color="#d8a878" />
      </mesh>

      {/* Torso: 0.5 wide × 0.7 tall × 0.28 deep at y≈-0.6 */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry attach="geometry" args={[0.5, 0.7, 0.28]} />
        <meshStandardMaterial attach="material" color="#00a8a8" />
      </mesh>

      {/* Left arm: 0.18×0.7×0.18 at x=-0.36, y≈-0.6 */}
      <mesh position={[-0.36, -0.6, 0]}>
        <boxGeometry attach="geometry" args={[0.18, 0.7, 0.18]} />
        <meshStandardMaterial attach="material" color="#d8a878" />
      </mesh>

      {/* Right arm: 0.18×0.7×0.18 at x=0.36, y≈-0.6 */}
      <mesh position={[0.36, -0.6, 0]}>
        <boxGeometry attach="geometry" args={[0.18, 0.7, 0.18]} />
        <meshStandardMaterial attach="material" color="#d8a878" />
      </mesh>

      {/* Left leg: 0.22×0.7×0.22 at x=-0.13, y≈-1.3 */}
      <mesh position={[-0.13, -1.3, 0]}>
        <boxGeometry attach="geometry" args={[0.22, 0.7, 0.22]} />
        <meshStandardMaterial attach="material" color="#3838a8" />
      </mesh>

      {/* Right leg: 0.22×0.7×0.22 at x=0.13, y≈-1.3 */}
      <mesh position={[0.13, -1.3, 0]}>
        <boxGeometry attach="geometry" args={[0.22, 0.7, 0.22]} />
        <meshStandardMaterial attach="material" color="#3838a8" />
      </mesh>

      {/* Name tag: floating above head, always facing camera */}
      <Billboard position={[0, 0.55, 0]}>
        <Text
          fontSize={0.25}
          color="white"
          outlineWidth={0.02}
          outlineColor="black"
          anchorY="bottom"
        >
          {name}
        </Text>
      </Billboard>
    </group>
  );
};

// Alias export for backwards compatibility.
export const Basicplayer = RemotePlayer;
