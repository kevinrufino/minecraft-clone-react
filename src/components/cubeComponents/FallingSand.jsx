import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { genFaceArrays } from "../../world/meshGen";
import { allMincraftTexture } from "../../images/textures";

// Smooth falling-sand renderer (#53). The sand simulation in Cubes.jsx detaches
// an unsupported sand block into a lightweight "entity" ({x, z, y(float), vy})
// and integrates its fall per frame. This component just draws those entities:
// one instanced sand cube per active entity, repositioned every frame, so the
// block visibly glides down instead of teleporting one cell per tick.

const MAX_FALLING = 256; // hard cap on simultaneously-drawn falling cubes

// Build the geometry for a single sand cube once, reusing the same atlas-based
// face arrays the chunk mesher uses, so a falling cube is pixel-identical to a
// placed sand block.
function buildSandGeometry() {
  const arrays = genFaceArrays(
    0.5,
    { "0.0.0": { pos: [0, 0, 0], texture: "sand" } },
    { keys: ["0.0.0"], count: 1 },
  );
  const s = arrays.solid;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(s.vertices, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(s.uvs, 2));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(s.normals, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(s.colors, 3));
  return geo;
}

export function FallingSand({ fallingSandRef }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(buildSandGeometry, []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: allMincraftTexture,
        vertexColors: true,
      }),
    [],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    const ents = fallingSandRef.current;
    const n = Math.min(ents.length, MAX_FALLING);
    for (let i = 0; i < n; i++) {
      const e = ents[i];
      dummy.position.set(e.x, e.y, e.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_FALLING]}
      // instances move every frame and start life at the origin, so the
      // auto-computed bounding sphere would cull them incorrectly
      frustumCulled={false}
    />
  );
}
