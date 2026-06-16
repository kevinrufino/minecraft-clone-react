import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import settings from "../../constants";
import { makeKey } from "../../world/keys";
import { useStore } from "../../hooks/useStore";
import { makeCrackTextures, CRACK_STAGES } from "../../world/crackTexture";

const REACH = 8; // max block distance you can interact with

// How long (seconds) it takes to break each block type by hand.
const HARDNESS = {
  leaves: 0.25,
  glass: 0.35,
  grass: 0.55,
  dirt: 0.55,
  sand: 0.55,
  gravel: 0.6,
  wood: 0.85,
  log: 0.95,
  stone: 1.3,
  cobblestone: 1.35,
  mossyCobblestone: 1.35,
  brick: 1.5,
  ironBlock: 1.6,
  goldBlock: 1.4,
  diamondBlock: 1.6,
  obsidian: 2.5,
};
function breakTime(texture) {
  return HARDNESS[texture] ?? 0.8;
}

// Centralized, crosshair-based mining for desktop play. Holding the left mouse
// button breaks the targeted block over ~0.25-2.5s (per block hardness) with a
// growing crack overlay; right-click places instantly. Mobile/joystick play
// keeps the existing tap handler in Chunk.jsx.
export function MiningController({
  applyBlockChange,
  REF_ALLCUBES,
  activeTextureREF,
}) {
  const { camera, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const center = useMemo(() => new THREE.Vector2(0, 0), []);
  const crackTextures = useMemo(() => makeCrackTextures(), []);

  const overlayRef = useRef();
  const crackMatRef = useRef();
  const mining = useRef({ leftDown: false, targetKey: null, progress: 0 });

  const [online_addCube, online_removeCube] = useStore((s) => [
    s.online_addCube,
    s.online_removeCube,
  ]);

  function raycastTarget() {
    raycaster.setFromCamera(center, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    const hit = hits.find((h) => h.object.name === "cubesMesh2");
    if (!hit || hit.distance > REACH) {
      return null;
    }
    const n = hit.face.normal;
    const normal = [n.x, n.y, n.z];
    const block = [hit.point.x, hit.point.y, hit.point.z].map((v, i) =>
      Math.round(v + 0.000002 * normal[i] * -1),
    );
    return { block, normal };
  }

  function placeBlock() {
    const target = raycastTarget();
    if (!target) {
      return;
    }
    const pos = target.block.map((v, i) => v + target.normal[i]);
    const texture = activeTextureREF.current;

    // can't place a block inside yourself
    const [px, py, pz] = camera.position;
    if (
      Math.abs(pos[0] - px) < 0.8 &&
      Math.abs(pos[2] - pz) < 0.8 &&
      pos[1] > py - 2 &&
      pos[1] < py + 0.5
    ) {
      return;
    }
    // don't overwrite an existing solid block
    const existing = REF_ALLCUBES.current[makeKey(...pos)];
    if (existing && existing.texture !== "water") {
      return;
    }
    applyBlockChange({ type: "add", pos, texture });
    if (settings.onlineEnabled) {
      online_addCube(pos, texture);
    }
  }

  function resetMining() {
    mining.current.targetKey = null;
    mining.current.progress = 0;
    if (overlayRef.current) {
      overlayRef.current.visible = false;
    }
  }

  useEffect(() => {
    if (settings.movewithJOY_BOOL) {
      return;
    }
    function onDown(e) {
      if (!document.pointerLockElement || useStore.getState().inventoryOpen) {
        return; // only act while actively playing
      }
      if (e.button === 0) {
        mining.current.leftDown = true;
      } else if (e.button === 2) {
        placeBlock();
      }
    }
    function onUp(e) {
      if (e.button === 0) {
        mining.current.leftDown = false;
        resetMining();
      }
    }
    function onLockChange() {
      if (!document.pointerLockElement) {
        mining.current.leftDown = false;
        resetMining();
      }
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("pointerlockchange", onLockChange);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }
    const m = mining.current;
    if (!m.leftDown || settings.movewithJOY_BOOL) {
      overlay.visible = false;
      return;
    }

    const target = raycastTarget();
    if (!target) {
      resetMining();
      return;
    }
    const key = makeKey(...target.block);
    const block = REF_ALLCUBES.current[key];
    if (!block || block.texture === "bedrock" || block.texture === "water") {
      resetMining();
      return;
    }

    // restart progress whenever the targeted block changes
    if (key !== m.targetKey) {
      m.targetKey = key;
      m.progress = 0;
    }
    m.progress += delta / breakTime(block.texture);

    overlay.position.set(target.block[0], target.block[1], target.block[2]);
    overlay.visible = true;
    const stage = Math.min(
      CRACK_STAGES - 1,
      Math.floor(m.progress * CRACK_STAGES),
    );
    if (crackMatRef.current && crackMatRef.current.map !== crackTextures[stage]) {
      crackMatRef.current.map = crackTextures[stage];
      crackMatRef.current.needsUpdate = true;
    }

    if (m.progress >= 1) {
      applyBlockChange({ type: "remove", pos: target.block });
      if (settings.onlineEnabled) {
        online_removeCube(target.block);
      }
      // keep breaking the next block if the button is still held
      m.targetKey = null;
      m.progress = 0;
      overlay.visible = false;
    }
  });

  return (
    <mesh ref={overlayRef} visible={false} renderOrder={998}>
      <boxGeometry args={[1.02, 1.02, 1.02]} />
      <meshBasicMaterial
        ref={crackMatRef}
        map={crackTextures[0]}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
}
