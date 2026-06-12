import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Mulberry32 seeded PRNG
function mulberry32(seed) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateClouds() {
  const rand = mulberry32(1337);
  const clusters = [];

  for (let i = 0; i < 40; i++) {
    const cx = (rand() - 0.5) * 400;
    const cz = (rand() - 0.5) * 400;
    const boxCount = Math.floor(rand() * 4) + 2; // 2-5 boxes
    const boxes = [];

    for (let b = 0; b < boxCount; b++) {
      const w = 8 + rand() * 8;   // 8-16
      const h = 0.4;
      const d = 6 + rand() * 6;   // 6-12
      const ox = (rand() - 0.5) * 10;
      const oz = (rand() - 0.5) * 8;
      boxes.push({ w, h, d, ox, oz });
    }

    clusters.push({ cx, cz, boxes });
  }

  return clusters;
}

const cloudMaterial = new THREE.MeshBasicMaterial({
  color: "white",
  transparent: true,
  opacity: 0.75,
});

export function Clouds() {
  const { camera } = useThree();
  const groupRef = useRef();

  const clusters = useMemo(() => generateClouds(), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    groupRef.current.position.x += delta * 1.2;

    // Wrap so clouds never run out relative to the camera
    if (groupRef.current.position.x - camera.position.x > 200) {
      groupRef.current.position.x -= 400;
    }

    // Snap Z to keep the field centered over the player
    groupRef.current.position.z =
      Math.round(camera.position.z / 400) * 400;
  });

  return (
    <group ref={groupRef} position={[0, 36, 0]}>
      {clusters.map((cluster, ci) =>
        cluster.boxes.map((box, bi) => (
          <mesh
            key={`${ci}-${bi}`}
            position={[cluster.cx + box.ox, 0, cluster.cz + box.oz]}
            material={cloudMaterial}
          >
            <boxGeometry args={[box.w, box.h, box.d]} />
          </mesh>
        ))
      )}
    </group>
  );
}
