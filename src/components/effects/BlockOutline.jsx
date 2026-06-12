import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export function BlockOutline() {
  const { camera, scene } = useThree();
  const meshRef = useRef();

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const center = useMemo(() => new THREE.Vector2(0, 0), []);
  const boxGeom = useMemo(() => new THREE.BoxGeometry(1.002, 1.002, 1.002), []);

  useFrame(() => {
    if (!meshRef.current) return;

    raycaster.setFromCamera(center, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    const hit = intersects.find((inter) => inter.object.name === "cubesMesh2");

    if (hit && hit.distance <= 8) {
      const n = hit.face.normal;
      const blockPos = [hit.point.x, hit.point.y, hit.point.z].map(
        (v, i) => Math.round(v + 0.000002 * [n.x, n.y, n.z][i] * -1)
      );
      meshRef.current.position.set(blockPos[0], blockPos[1], blockPos[2]);
      meshRef.current.visible = true;
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <lineSegments ref={meshRef} visible={false}>
      <edgesGeometry args={[boxGeom]} />
      <lineBasicMaterial color="black" transparent opacity={0.6} />
    </lineSegments>
  );
}
