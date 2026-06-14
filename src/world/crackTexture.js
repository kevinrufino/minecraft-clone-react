import * as THREE from "three";

// Number of discrete crack stages (Minecraft uses 10; 6 reads fine here).
export const CRACK_STAGES = 6;

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Procedurally draws cumulative crack patterns onto transparent canvases and
// returns one nearest-filtered THREE texture per break stage. The atlas image
// is a JPEG with no alpha channel, so its built-in destroy-stage tiles can't
// be overlaid transparently -- generating cracks here keeps them see-through.
export function makeCrackTextures() {
  const size = 64;
  const rng = mulberry32(0x9e3779b1);

  // a fixed pool of crack segments; each stage reveals progressively more
  const total = 26;
  const segments = [];
  for (let i = 0; i < total; i++) {
    const x0 = rng() * size;
    const y0 = rng() * size;
    const ang = rng() * Math.PI * 2;
    const len = 8 + rng() * 20;
    segments.push([x0, y0, x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len]);
  }

  const textures = [];
  for (let s = 0; s < CRACK_STAGES; s++) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.65)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const count = Math.ceil(((s + 1) / CRACK_STAGES) * total);
    for (let i = 0; i < count; i++) {
      const [a, b, c, d] = segments[i];
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    textures.push(tex);
  }
  return textures;
}
