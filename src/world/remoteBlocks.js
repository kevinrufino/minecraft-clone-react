// Bridges socket block events into the chunk system. The socket connects
// before the world finishes generating, so events are queued until Cubes
// registers an applier.
let applier = null;
const queue = [];

export function setRemoteBlockApplier(fn) {
  applier = fn;
  if (fn) {
    queue.splice(0).forEach(fn);
  }
}

// event: { type: "add"|"remove", pos: [x,y,z], texture? }
export function applyRemoteBlockEvent(event) {
  if (applier) {
    applier(event);
  } else {
    queue.push(event);
  }
}
