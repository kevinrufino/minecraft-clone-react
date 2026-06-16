import { useEffect, useRef, useState } from "react";
import { Chunk } from "./Chunk";
import { useFrame, useThree } from "@react-three/fiber";
import settings from "../../constants";
import {
  chunkKeyFromPosition,
  distBetweenChunks,
  getNearbyChunkKeys,
} from "../../world/chunkMath";
import { makeKey } from "../../world/keys";
import { setRemoteBlockApplier } from "../../world/remoteBlocks";
import { recordEdit, editsForChunks, loadEdits } from "../../world/edits";

export const Cubes = ({
  activeTextureREF,
  REF_ALLCUBES,
  updateInitStatus,
  chunksMadeCounter,
  spawnPos,
}) => {
  const { camera } = useThree();
  const [FillerLoadDoneValue, setFillerLoadDone] = useState(false);
  const [chunkKeyList, setChunkKeyList] = useState([]);
  // view radii are read from settings on every use -- CoreGame adjusts them
  // live based on measured performance
  const fillBatchSize = settings.fillBatchSize; // chunks allowed per worker job
  const worldSettings = settings.worldSettings;
  const renderDistPrecentage = settings.renderDistPrecentage;

  // Chunk generation is CPU-bound and bursty (only while streaming), so scale
  // the pool with available cores -- leaving one for the main/render thread --
  // instead of a fixed count. settings.workerCount is the floor/fallback when
  // hardwareConcurrency is unavailable; capped to avoid oversubscription.
  const workerCount = Math.max(
    settings.workerCount,
    Math.min(8, (navigator.hardwareConcurrency || settings.workerCount + 1) - 1),
  );
  const workerPendingJob = useRef([]);
  const workerWorking = useRef(new Array(workerCount).fill(true));
  const workerList = useRef(new Array(workerCount).fill(""));

  const spawnChunk = chunkKeyFromPosition(
    spawnPos[0],
    spawnPos[2],
    worldSettings.chunkSize,
  );
  const lastRenderChunk = useRef(spawnChunk);
  const chunks = useRef({}); // chunkKey -> {keys, count, visible, draw}
  const pendingFill = useRef(new Set()); // chunks queued but not yet generated
  // mirror of chunkKeyList (the mounted <Chunk> set) for O(1) membership tests,
  // plus a nearest-first queue of generated chunks still waiting to be mounted.
  // Mounts are drained a few per frame (drainMountQueue) so the GPU uploads they
  // trigger never spike the frame time.
  const mountedSet = useRef(new Set());
  const mountQueue = useRef([]);
  const playerChunkPosition = useRef("");

  const buildWorker = (id) => {
    const worker = new Worker(
      new URL("../../workers/chunkWorker.js", import.meta.url),
    );
    worker.onerror = (err) => {
      console.error("worker error:", err);
    };

    //responsible for handeling the workers response
    worker.onmessage = (e) => {
      if (e.data.regFlow) {
        handleWorkerUserChangeResponse(e.data.regFlow);
      } else if (e.data.worldFiller) {
        chunksMadeCounter.current.track.count +=
          e.data.worldFiller.chunkKeys.length;
        if (chunksMadeCounter.current.ref) {
          chunksMadeCounter.current.ref.updateDisplay();
        }
        handleWorkerWorldFillResponse(e.data.worldFiller);
      }
      if (workerPendingJob.current.length > 0) {
        getPendingJob(id);
      } else {
        workerWorking.current[id] = false;
      }
    };
    return worker;
  };

  // monotonic revision so every re-mesh remounts its geometry -- reusing a
  // bufferGeometry with different-sized arrays corrupts/blanks the mesh
  const meshRev = useRef(0);

  function handleWorkerUserChangeResponse(data) {
    const { draw, count, chunkKey } = data;
    if (!chunks.current[chunkKey]) {
      return;
    }
    chunks.current[chunkKey].draw = {
      cc: count,
      rev: ++meshRev.current,
      solid: draw.solid,
      trans: draw.trans,
      rere: true,
    };
  }

  function handleWorkerWorldFillResponse(worldFiller) {
    Object.assign(REF_ALLCUBES.current, worldFiller.ac);

    worldFiller.chunkKeys.forEach((ck) => {
      chunks.current[ck] = worldFiller.testor[ck];
      pendingFill.current.delete(ck);
    });
    // queue any of these that are in view; drainMountQueue (in useFrame) mounts
    // them a few per frame -- never the whole batch in one stalling commit
    recomputeChunkSet(playerChunkPosition.current || spawnChunk);

    if (workerPendingJob.current.length == 0) {
      chunksMadeCounter.current.loaddone = true;
      if (chunksMadeCounter.current.ref) {
        chunksMadeCounter.current.ref.updateDisplay();
      }
      setFillerLoadDone(true);
    }
  }

  function giveWorkerUserChangeJob(workerId, chunkKey) {
    const t = 0.5;
    const neededblocks = {};
    getNearbyChunkKeys(chunkKey, 1.5).forEach((ck) => {
      if (chunks.current[ck]) {
        chunks.current[ck].keys.forEach((bn) => {
          neededblocks[bn] = REF_ALLCUBES.current[bn];
        });
      }
    });
    workerList.current[workerId].postMessage({
      userChange: {
        t,
        blocks: neededblocks,
        chunkBlocks: chunks.current[chunkKey],
        chunkKey,
      },
    });
  }

  function giveWorkerWorldFillJob(workerId, chunkinfo) {
    // include neighbor chunks' edits so the culling margin sees them too
    const withNeighbors = new Set();
    chunkinfo.arr.forEach((ck) => {
      getNearbyChunkKeys(ck, 1.5).forEach((n) => withNeighbors.add(n));
    });
    workerList.current[workerId].postMessage({
      worldFill: {
        chunks: chunkinfo.arr,
        edits: editsForChunks([...withNeighbors], worldSettings.chunkSize),
      },
    });
  }

  //this function is for worker job management
  //if there is a new job give it to an open worker if not Q it up
  function addWorkerJob(chunkinfo, type) {
    let taken = false; //worker took new job
    for (let i = 0; i < workerList.current.length; i++) {
      if (!workerWorking.current[i] && !taken) {
        workerWorking.current[i] = true;
        taken = true;
        if (type === "worldFill") {
          giveWorkerWorldFillJob(i, chunkinfo);
        } else if (type === "user") {
          giveWorkerUserChangeJob(i, chunkinfo);
        }
      }
    }

    if (!taken) {
      //no worker took new job so Q it up
      workerPendingJob.current.push({
        chunkinfo,
        type,
        pl: jobTypePriority(type),
      });
      workerPendingJob.current.sort((ja, jb) => {
        return ja.pl - jb.pl;
      });
    }
  }

  function jobTypePriority(type) {
    switch (type) {
      case "user":
        return 0;
      case "worldFill":
        return 1;
      default:
        return 0;
    }
  }

  //function executed by workers asking for more work
  function getPendingJob(workernum) {
    const job = workerPendingJob.current.shift();
    if (job.type === "worldFill") {
      giveWorkerWorldFillJob(workernum, job.chunkinfo);
    } else if (job.type === "user") {
      giveWorkerUserChangeJob(workernum, job.chunkinfo);
    }
  }

  // ---- water flow (Minecraft-style, simplified) ----
  // Water spreads down freely and sideways up to FLOW_RANGE cells. The queue
  // holds positions to examine; only cells that are water act. Every path
  // that changes blocks feeds it, so remote players' digs flow too.
  const FLOW_RANGE = 4;
  const flowQueue = useRef([]);
  const lastFlowTick = useRef(0);

  function enqueueFlowAround(pos) {
    const [x, y, z] = pos;
    flowQueue.current.push(
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y, z + 1],
      [x, y, z - 1],
      [x, y + 1, z],
    );
  }

  function tickWaterFlow() {
    const now = performance.now();
    if (!flowQueue.current.length || now - lastFlowTick.current < 200) {
      return;
    }
    lastFlowTick.current = now;
    const batch = flowQueue.current.splice(0, 64);
    batch.forEach(([x, y, z]) => {
      const cell = REF_ALLCUBES.current[makeKey(x, y, z)];
      if (!cell || cell.texture !== "water") {
        return;
      }
      const flow = cell.flow ?? FLOW_RANGE; // generated water is a source
      const belowKey = makeKey(x, y - 1, z);
      if (!REF_ALLCUBES.current[belowKey] && y - 1 > worldSettings.minY) {
        // falling water keeps full strength
        applyBlockChange({
          type: "add",
          pos: [x, y - 1, z],
          texture: "water",
          flow: FLOW_RANGE,
        });
      } else if (flow > 1) {
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].forEach(([dx, dz]) => {
          if (!REF_ALLCUBES.current[makeKey(x + dx, y, z + dz)]) {
            applyBlockChange({
              type: "add",
              pos: [x + dx, y, z + dz],
              texture: "water",
              flow: flow - 1,
            });
          }
        });
      }
    });
  }

  // ---- sand gravity (Minecraft-style) ----
  // Sand only falls in response to a block update (placing it, or removing
  // whatever was under it) -- it does not auto-collapse generated terrain.
  // A falling block drops one cell per tick until something solid stops it,
  // sinking through water on the way down.
  const SAND_TICK_MS = 80;
  const sandQueue = useRef([]);
  const lastSandTick = useRef(0);

  function tickSandFall() {
    const now = performance.now();
    if (!sandQueue.current.length || now - lastSandTick.current < SAND_TICK_MS) {
      return;
    }
    lastSandTick.current = now;
    const batch = sandQueue.current.splice(0, 128);
    batch.forEach(([x, y, z]) => {
      const here = REF_ALLCUBES.current[makeKey(x, y, z)];
      if (!here || here.texture !== "sand") {
        return;
      }
      if (y - 1 <= worldSettings.minY) {
        return; // resting on the bedrock floor
      }
      const below = REF_ALLCUBES.current[makeKey(x, y - 1, z)];
      // fall into empty space, or sink through water
      if (!below || below.texture === "water") {
        applyBlockChange({ type: "remove", pos: [x, y, z] });
        applyBlockChange({ type: "add", pos: [x, y - 1, z], texture: "sand" });
        // keep falling, and let any sand stacked above this column drop too
        sandQueue.current.push([x, y - 1, z], [x, y + 1, z]);
      }
    });
  }

  // Single entry point for every block mutation: local clicks, remote
  // players, and persisted-edit replay all flow through here.
  function applyBlockChange(event) {
    recordEdit(event, !settings.onlineEnabled);

    if (event.type === "remove") {
      // neighboring water may flow into the new hole
      enqueueFlowAround(event.pos);
      // sand resting directly above the removed block is now unsupported
      sandQueue.current.push([event.pos[0], event.pos[1] + 1, event.pos[2]]);
    } else if (event.texture === "water") {
      // newly placed/flowed water may keep spreading
      flowQueue.current.push([...event.pos]);
    } else if (event.texture === "sand") {
      // freshly placed sand may need to fall
      sandQueue.current.push([...event.pos]);
    }

    const ck = chunkKeyFromPosition(
      event.pos[0],
      event.pos[2],
      worldSettings.chunkSize,
    );
    const chunk = chunks.current[ck];
    if (!chunk) {
      // chunk not generated yet -- the edit overlay applies it at gen time
      return;
    }

    const key = makeKey(...event.pos);
    if (event.type === "add") {
      const existing = REF_ALLCUBES.current[key];
      if (existing && existing.texture !== "water") {
        return;
      }
      REF_ALLCUBES.current[key] = {
        pos: event.pos,
        texture: event.texture,
        ...(event.flow != null && { flow: event.flow }),
      };
      if (!existing) {
        chunk.keys.push(key);
        chunk.count++;
      }
    } else if (event.type === "remove") {
      if (!(key in REF_ALLCUBES.current)) {
        return;
      }
      delete REF_ALLCUBES.current[key];
      const i = chunk.keys.indexOf(key);
      if (i !== -1) {
        chunk.keys[i] = chunk.keys[chunk.keys.length - 1];
        chunk.keys.pop();
      }
      chunk.count--;
    }
    addWorkerJob(ck, "user");

    // a block on a chunk border changes face culling in the neighbor too
    const [x, , z] = event.pos;
    const cS = worldSettings.chunkSize;
    const neighbors = new Set();
    [
      [x - 1, z],
      [x + 1, z],
      [x, z - 1],
      [x, z + 1],
    ].forEach(([nx, nz]) => {
      const nck = chunkKeyFromPosition(nx, nz, cS);
      if (nck !== ck && chunks.current[nck]) {
        neighbors.add(nck);
      }
    });
    neighbors.forEach((nck) => addWorkerJob(nck, "user"));
  }

  function fillMissingChunks(centerChunk, radius) {
    const missing = getNearbyChunkKeys(centerChunk, radius).filter((ck) => {
      return !chunks.current[ck] && !pendingFill.current.has(ck);
    });
    if (!missing.length) {
      return 0;
    }
    missing.sort(
      (a, b) =>
        distBetweenChunks(centerChunk, a) - distBetweenChunks(centerChunk, b),
    );
    missing.forEach((ck) => pendingFill.current.add(ck));
    for (let i = 0; i < missing.length; i += fillBatchSize) {
      addWorkerJob({ arr: missing.slice(i, i + fillBatchSize) }, "worldFill");
    }
    return missing.length;
  }

  const lastRadius = useRef(settings.viewRadius);

  useFrame(() => {
    if (process.env.NODE_ENV === "development") {
      window.__chunkDebug = {
        chunks: Object.keys(chunks.current).length,
        visible: Object.values(chunks.current).filter((c) => c.visible).length,
        rendered: chunkKeyList.length,
        radius: settings.viewRadius,
        pending: pendingFill.current.size,
        queue: workerPendingJob.current.length,
        pChunk: playerChunkPosition.current,
      };
    }
    const pChunk = chunkKeyFromPosition(
      camera.position.x,
      camera.position.z,
      worldSettings.chunkSize,
    );

    if (!chunksMadeCounter.current.loaddone || !FillerLoadDoneValue) {
      return;
    }

    tickWaterFlow();
    tickSandFall();

    // performance tuning (or the pause-menu slider) changed the render distance
    if (lastRadius.current !== settings.viewRadius) {
      lastRadius.current = settings.viewRadius;
      fillMissingChunks(pChunk, settings.outerViewRadius);
      recomputeChunkSet(pChunk);
    }

    if (playerChunkPosition.current !== pChunk) {
      playerChunkPosition.current = pChunk;
      if (
        distBetweenChunks(lastRenderChunk.current, pChunk) >=
        renderDistPrecentage *
          (settings.outerViewRadius - settings.viewRadius)
      ) {
        lastRenderChunk.current = pChunk;
        fillMissingChunks(pChunk, settings.outerViewRadius);
      }
      recomputeChunkSet(pChunk);
    }

    // mount a few queued chunks per frame so geometry uploads stay spread out
    drainMountQueue();
  });

  useEffect(() => {
    if (!workerList.current[0]) {
      if (!settings.onlineEnabled) {
        const loaded = loadEdits(settings.currentSaveId || worldSettings.seed);
        if (loaded) {
          console.log(`Loaded ${loaded} saved block edits`);
        }
      }

      let workersmade = 0;
      workerList.current.forEach((ele, ind) => {
        workerList.current[ind] = buildWorker(ind);
        workersmade++;
        workerList.current[ind].postMessage({
          init: { worldSettings: { ...worldSettings, w_ind: ind } },
        });
      });
      updateInitStatus({ buildWorkers: workersmade });
    }
    // initial world fill around spawn
    if (workerList.current[0] && !chunksMadeCounter.current.loaddone) {
      const queued = fillMissingChunks(spawnChunk, settings.outerViewRadius);
      chunksMadeCounter.current.track.max = queued;
    }

    setRemoteBlockApplier(applyBlockChange);
    return () => setRemoteBlockApplier(null);
  }, []);

  // Keep chunks mounted a little past the draw radius so small back-and-forth
  // movements across a chunk border don't thrash mount/unmount.
  const UNLOAD_MARGIN = 1;

  // Recompute which generated chunks belong on screen around the player: rebuild
  // the nearest-first queue of not-yet-mounted ones, and unmount any that
  // drifted out of range (unmounting disposes their GPU geometry). Mounting is
  // rate-limited in drainMountQueue -- this function never adds meshes itself.
  function recomputeChunkSet(centerChunk) {
    const desired = getNearbyChunkKeys(centerChunk, settings.viewRadius).filter(
      (ck) => chunks.current[ck],
    );

    mountQueue.current = desired
      .filter((ck) => !mountedSet.current.has(ck))
      .sort(
        (a, b) =>
          distBetweenChunks(centerChunk, a) - distBetweenChunks(centerChunk, b),
      );

    const keepRadius = settings.viewRadius + UNLOAD_MARGIN;
    let removed = false;
    mountedSet.current.forEach((ck) => {
      if (distBetweenChunks(centerChunk, ck) > keepRadius) {
        mountedSet.current.delete(ck);
        if (chunks.current[ck]) {
          chunks.current[ck].visible = false;
        }
        removed = true;
      }
    });
    if (removed) {
      setChunkKeyList([...mountedSet.current]);
    }
  }

  // Mount up to chunkMountBudget queued chunks this frame, nearest first. This
  // is the throttle that turns a batch of ready chunks into a smooth stream of
  // single-frame GPU uploads instead of one big stall.
  function drainMountQueue() {
    if (!mountQueue.current.length) {
      return;
    }
    const budget = settings.chunkMountBudget;
    let mounted = 0;
    while (mounted < budget && mountQueue.current.length) {
      const ck = mountQueue.current.shift();
      if (mountedSet.current.has(ck) || !chunks.current[ck]) {
        continue;
      }
      chunks.current[ck].visible = true; // Chunk renders its mesh once visible
      mountedSet.current.add(ck);
      mounted++;
    }
    if (mounted > 0) {
      setChunkKeyList([...mountedSet.current]);
    }
  }

  return !FillerLoadDoneValue
    ? null
    : chunkKeyList.map((ck) => {
        return (
          <Chunk
            key={`cubechunk${ck}`}
            chunkKey={ck}
            chunkProps={chunks}
            activeTextureREF={activeTextureREF}
            REF_ALLCUBES={REF_ALLCUBES}
            applyBlockChange={applyBlockChange}
          />
        );
      });
};
