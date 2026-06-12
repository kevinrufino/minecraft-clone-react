import { Sky } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

const DAY_LENGTH_S = 2400; // full day/night cycle (40 min)
const DAY_FOG = new THREE.Color("#d7e7f5");
const NIGHT_FOG = new THREE.Color("#070b14");

// Drives the sun: a directional light + ambient light + the drei Sky dome,
// and tints the scene fog/background from day to night. Lights are mutated
// per frame via refs; the Sky component re-renders on a slow tick.
export function DayNight({ showSky }) {
  const { scene } = useThree();
  const sunRef = useRef();
  const ambRef = useRef();
  const fogColor = useRef(new THREE.Color().copy(DAY_FOG));
  const lastSkyTick = useRef(0);
  const [sunPos, setSunPos] = useState([80, 60, 20]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // start mid-morning so new games begin in daylight
    const angle = (t / DAY_LENGTH_S) * Math.PI * 2 + Math.PI / 5;
    const sin = Math.sin(angle);
    const pos = [Math.cos(angle) * 100, sin * 100, 20];
    // 0 = night, 1 = day, with a quick dawn/dusk transition
    const dayness = THREE.MathUtils.clamp(sin * 3, -1, 1) * 0.5 + 0.5;

    if (sunRef.current) {
      sunRef.current.position.set(pos[0], pos[1], pos[2]);
      sunRef.current.intensity = 0.55 * dayness;
    }
    if (ambRef.current) {
      ambRef.current.intensity = 0.3 + 0.25 * dayness;
    }

    fogColor.current.copy(NIGHT_FOG).lerp(DAY_FOG, dayness);
    if (scene.fog) {
      scene.fog.color.copy(fogColor.current);
    }
    scene.background = fogColor.current;

    // the Sky dome only needs coarse updates
    if (t - lastSkyTick.current > 0.5) {
      lastSkyTick.current = t;
      setSunPos(pos);
    }
  });

  return (
    <>
      {showSky && <Sky sunPosition={sunPos} />}
      <ambientLight ref={ambRef} intensity={0.65} />
      <directionalLight ref={sunRef} position={sunPos} intensity={0.9} />
    </>
  );
}
