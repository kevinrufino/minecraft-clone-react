// Block keys are "x.y.z" strings used to index the world block map.
export function makeKey(x, y, z) {
  return x + "." + y + "." + z;
}
