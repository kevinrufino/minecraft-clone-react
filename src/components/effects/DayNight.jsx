import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const DAY_LENGTH_S = 2400; // full day/night cycle (40 min)
const DAY_FOG = new THREE.Color("#d7e7f5");
const NIGHT_FOG = new THREE.Color("#0a0f1c");
const DAY_SKY = new THREE.Color("#88c0ff"); // overhead daytime blue
const NIGHT_SKY = new THREE.Color("#05070f");

const SKY_DIST = 150; // how far the sun/moon/stars sit from the player

// Drives the sky: sun + moon directional lights, ambient fill, and the sun,
// moon and star meshes that ride across the sky. The old drei <Sky> dome is
// gone (it never darkened at night); the background color is lerped from a
// daytime blue to near-black instead, with stars fading in after dusk.
export function DayNight({ showSky }) {
  const { scene } = useThree();
  const sunLightRef = useRef();
  const moonLightRef = useRef();
  const ambRef = useRef();
  const skyGroupRef = useRef();
  const sunMeshRef = useRef();
  const moonMeshRef = useRef();
  const starsMatRef = useRef();

  const fogColor = useRef(new THREE.Color().copy(DAY_FOG));
  const bgColor = useRef(new THREE.Color().copy(DAY_SKY));

  // a fixed dome of stars, generated once
  const starGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const N = 900;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = SKY_DIST * 0.98;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.85 + 8; // bias above horizon
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    // start mid-morning so new games begin in daylight
    const angle = (t / DAY_LENGTH_S) * Math.PI * 2 + Math.PI / 5;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    // unit sun direction (slightly tilted off the x/y plane)
    const sx = cos;
    const sy = sin;
    const sz = 0.25;
    const len = Math.hypot(sx, sy, sz);
    const ux = sx / len;
    const uy = sy / len;
    const uz = sz / len;

    // 0 = night, 1 = day, with a quick dawn/dusk transition
    const dayness = THREE.MathUtils.clamp(sin * 3, -1, 1) * 0.5 + 0.5;
    const nightness = 1 - dayness;

    if (sunLightRef.current) {
      sunLightRef.current.position.set(ux * 100, uy * 100, uz * 100);
      sunLightRef.current.intensity = 0.7 * dayness;
    }
    if (moonLightRef.current) {
      // moonlight comes from the opposite side; keeps nights navigable
      moonLightRef.current.position.set(-ux * 100, -uy * 100, -uz * 100);
      moonLightRef.current.intensity = 0.28 * nightness;
    }
    if (ambRef.current) {
      // never fully dark, so caves/nights stay playable
      ambRef.current.intensity = 0.22 + 0.4 * dayness;
    }

    fogColor.current.copy(NIGHT_FOG).lerp(DAY_FOG, dayness);
    if (scene.fog) {
      scene.fog.color.copy(fogColor.current);
    }
    bgColor.current.copy(NIGHT_SKY).lerp(DAY_SKY, dayness);
    scene.background = bgColor.current;

    // keep the celestial dome centered on the player so it reads as infinitely
    // far (no parallax as you walk)
    if (skyGroupRef.current) {
      skyGroupRef.current.position.copy(camera.position);
    }
    if (sunMeshRef.current) {
      sunMeshRef.current.position.set(
        ux * SKY_DIST,
        uy * SKY_DIST,
        uz * SKY_DIST,
      );
    }
    if (moonMeshRef.current) {
      moonMeshRef.current.position.set(
        -ux * SKY_DIST,
        -uy * SKY_DIST,
        -uz * SKY_DIST,
      );
    }
    if (starsMatRef.current) {
      starsMatRef.current.opacity = THREE.MathUtils.clamp(
        nightness * 1.4 - 0.1,
        0,
        1,
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.5} />
      <directionalLight ref={sunLightRef} intensity={0.9} color="#fff4d6" />
      <directionalLight ref={moonLightRef} intensity={0} color="#8aa0d8" />
      {showSky && (
        <group ref={skyGroupRef}>
          {/* sun */}
          <mesh ref={sunMeshRef}>
            <sphereGeometry args={[9, 20, 20]} />
            <meshBasicMaterial color="#fff2a8" fog={false} toneMapped={false} />
          </mesh>
          {/* moon */}
          <mesh ref={moonMeshRef}>
            <sphereGeometry args={[6, 20, 20]} />
            <meshBasicMaterial color="#e6ecf5" fog={false} toneMapped={false} />
          </mesh>
          {/* stars */}
          <points geometry={starGeom}>
            <pointsMaterial
              ref={starsMatRef}
              size={1.5}
              color="#ffffff"
              sizeAttenuation
              transparent
              opacity={0}
              depthWrite={false}
              fog={false}
            />
          </points>
        </group>
      )}
    </>
  );
}
