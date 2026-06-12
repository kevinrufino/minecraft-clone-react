import { useEffect, useRef, useState } from "react";
import { Chunk } from "./Chunk";
import { useFrame, useThree } from "@react-three/fiber";
import settings from "../../constants";
import {
  chunkIdFromPosition,
  distBetweenChunks,
  getNearbyChunkIds,
} from "../../world/chunkMath";
import { makeKey } from "../../world/keys";
import { setRemoteBlockApplier } from "../../world/remoteBlocks";

export const Cubes = ({
  activeTextureREF,
  REF_ALLCUBES,
  updateInitStatus,
  chunksMadeCounter,
}) => {
  const { camera } = useThree();
  const [FillerLoadDoneValue, setFillerLoadDone] = useState(false);
  let viewRadius = settings.viewRadius; //this number is distance from current place chunks are allowed to be shown
  let outerViewRadius = settings.outerViewRadius; //this number is the distance from current place we insure are built/ready to be shown
  let fillBatchSize = settings.fillBatchSize; // chunks allowed per worker job
  let worldSettings = settings.worldSettings;
  let renderDistPrecentage = settings.renderDistPrecentage;

  // i believe for most machines 4 workers is the effective limit but i am using 3 to be safe
  let workerCount = settings.workerCount; //a set number of workers
  const workerPendingJob = useRef([]);
  const workerWorking = useRef(new Array(workerCount).fill(true));
  const workerList = useRef(new Array(workerCount).fill(""));

  const lastRenderChunk = useRef(settings.startingChunk);

  const chunks = useRef(
    new Array(worldSettings.worldSize ** 2).fill().map(() => {
      return new Object({ count: 0, draw: { cc: 0, rere: false } });
    }),
  );

  /* 
    example
    chunks.current is whats  below
      [{
        keys: [0.0.0,0.0.1,...]
        count: ####
        draw:{ cc,vertices, uvs, normals,rere}
      }
      ,...] 
  */

  const activeChunks = useRef([]);
  const playerChunkPosition = useRef(-1);

  const buildWorker = (id) => {
    const worker = new Worker(
      new URL("../../workers/chunkWorker.js", import.meta.url),
    );
    worker.onerror = (err) => {
      console.log("myWorker Error:", err);
    };

    //responsible for handeling the workers response
    worker.onmessage = (e) => {
      if (e.data.regFlow) {
        handleWorkerUserChangeResponse(e.data.regFlow);
      } else if (e.data.worldFiller) {
        chunksMadeCounter.current.track.count +=
          e.data.worldFiller.chunkNumbers.length;
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

  function handleWorkerUserChangeResponse(data) {
    let { vertices, uvs, normals, count, chunkNumber } = data;
    vertices = new Float32Array(vertices);
    uvs = new Float32Array(uvs);
    normals = new Float32Array(normals);
    chunks.current[chunkNumber].draw = {
      cc: count,
      vertices,
      uvs,
      normals,
      rere: true,
    };
    // worker.terminate(); //use to kill the workers // unsure if we ever have too
  }

  function handleWorkerWorldFillResponse(worldFiller) {
    Object.assign(REF_ALLCUBES.current, worldFiller.ac);

    worldFiller.chunkNumbers.forEach((cn) => {
      chunks.current[cn] = worldFiller.testor[cn];
    });
    if (workerPendingJob.current.length == 0) {
      chunksMadeCounter.current.loaddone = true;
      if (chunksMadeCounter.current.ref) {
        chunksMadeCounter.current.ref.updateDisplay();
      }
      setFillerLoadDone(true);
    }
  }

  function giveWorkerUserChangeJob(workerId, chunkinfo) {
    let chunkNumber = chunkinfo;
    let t = 0.5;
    let adjacentchunks = getNearbyChunkIds(
      chunkNumber,
      1,
      worldSettings.worldSize,
    );
    let neededblocks = {};
    adjacentchunks.forEach((cn) => {
      chunks.current[cn].keys.forEach((bn) => {
        neededblocks[bn] = REF_ALLCUBES.current[bn];
      });
    });
    let blocks = neededblocks;
    let chunkBlocks = chunks.current[chunkNumber];
    workerList.current[workerId].postMessage({
      userChange: { t, blocks, chunkBlocks, chunkNumber },
    });
  }

  function giveWorkerWorldFillJob(workerId, chunkinfo) {
    workerList.current[workerId].postMessage({ worldFill: chunkinfo.arr });
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

  //attempt to give workers a job priority -- unfinished
  function jobTypePriority(type) {
    switch (type) {
      case "user":
        return 0;
      case "worldFill":
        return 1;
      case "dyna":
        return 3;
      default:
        return 0;
    }
  }

  //function executed by workers asking for more work
  function getPendingJob(workernum) {
    let job = workerPendingJob.current.shift();
    if (job.type === "worldFill") {
      giveWorkerWorldFillJob(workernum, job.chunkinfo);
    } else if (job.type === "user") {
      giveWorkerUserChangeJob(workernum, job.chunkinfo);
    }
  }

  useFrame(() => {
    const pChunk = chunkIdFromPosition(
      camera.position.x,
      camera.position.z,
      worldSettings,
    );

    if (
      playerChunkPosition.current !== pChunk &&
      chunksMadeCounter.current.loaddone &&
      FillerLoadDoneValue
    ) {
      playerChunkPosition.current = pChunk;
      if (
        distBetweenChunks(
          lastRenderChunk.current,
          pChunk,
          worldSettings.worldSize,
        ) >=
        renderDistPrecentage * (outerViewRadius - viewRadius)
      ) {
        checkWorldFilledRadius(pChunk);
      }
      updateDisplayedChunks(pChunk);
    }
  });

  useEffect(() => {
    if (!workerList.current[0]) {
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
    // triggering world fill once
    if (workerList.current[0] && !chunksMadeCounter.current.loaddone) {
      const ourCurrentChunk = settings.startingChunk;
      // fill closest chunks first so the area around the player loads first
      const worldFillarr = getNearbyChunkIds(
        ourCurrentChunk,
        outerViewRadius,
        worldSettings.worldSize,
      ).sort(
        (a, b) =>
          distBetweenChunks(ourCurrentChunk, a, worldSettings.worldSize) -
          distBetweenChunks(ourCurrentChunk, b, worldSettings.worldSize),
      );
      queueWorldFillBatches(worldFillarr);
    }
  }, []);

  function queueWorldFillBatches(chunkIds) {
    for (let i = 0; i < chunkIds.length; i += fillBatchSize) {
      addWorkerJob({ arr: chunkIds.slice(i, i + fillBatchSize) }, "worldFill");
    }
  }

  // apply block changes made by other online players
  useEffect(() => {
    if (!FillerLoadDoneValue) {
      return;
    }
    setRemoteBlockApplier((event) => {
      const [x, , z] = event.pos;
      const cn = chunkIdFromPosition(x, z, worldSettings);
      const chunk = chunks.current[cn];
      if (cn < 0 || cn >= chunks.current.length || !chunk || !chunk.keys) {
        return;
      }

      const key = makeKey(...event.pos);
      if (event.type === "add") {
        if (key in REF_ALLCUBES.current) {
          return;
        }
        REF_ALLCUBES.current[key] = {
          pos: event.pos,
          texture: event.texture || "dirt",
        };
        chunk.keys.push(key);
        chunk.count++;
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
      addWorkerJob(cn, "user");
    });
    return () => setRemoteBlockApplier(null);
  }, [FillerLoadDoneValue]);

  function updateDisplayedChunks(currentChunk) {
    let chunksToDisplay = getNearbyChunkIds(
      currentChunk,
      viewRadius,
      worldSettings.worldSize,
    );
    let removeChunks = activeChunks.current.filter((id) => {
      return !chunksToDisplay.includes(id);
    });
    let newlyDisplayChunks = chunksToDisplay.filter((id) => {
      return !activeChunks.current.includes(id);
    });
    removeChunks.forEach((id) => {
      chunks.current[id].visible = false;
    });
    newlyDisplayChunks.forEach((id) => {
      chunks.current[id].visible = true;
    });
    activeChunks.current = chunksToDisplay;
  }

  function checkWorldFilledRadius(currentChunk) {
    lastRenderChunk.current = playerChunkPosition.current;
    const chunksTofill = getNearbyChunkIds(
      currentChunk,
      outerViewRadius,
      worldSettings.worldSize,
    ).filter((cn) => {
      return !chunks.current[cn].count;
    });
    queueWorldFillBatches(chunksTofill);
  }

  function showChunks() {
    return !chunksMadeCounter.current.loaddone
      ? ""
      : chunks.current.map((ele, ind) => {
          return (
            <Chunk
              key={`cubechunk${ind}`}
              chunkNum={ind}
              chunkProps={chunks}
              activeTextureREF={activeTextureREF}
              REF_ALLCUBES={REF_ALLCUBES}
              addWorkerJob={addWorkerJob}
            />
          );
        });
  }

  return showChunks();
};
