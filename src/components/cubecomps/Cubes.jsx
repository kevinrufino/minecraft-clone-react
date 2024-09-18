import { useEffect, useRef, useState } from "react";
import { Chunk } from "./Chunk";
import { useFrame, useThree } from "@react-three/fiber";
import settings from "../../devOnline";

export const Cubes = ({ activeTextureREF, REF_ALLCUBES, updateInitStatus, initStatus, chunksmadecounter }) => {
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

  const lastRenderChunk = useRef(settings.startingChunk)

  //used to keep track of what to add or remove when a face is clicked
  const cubeFaceIndexesREFlist = useRef(new Array(worldSettings.worldSize ** 2).fill({}));
  const chunks = useRef(
    new Array(worldSettings.worldSize ** 2).fill().map(() => {
      return new Object({ count: 0, draw: { cc: 0, rere: false } });
    })
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
    const worker = new Worker("./dist/publicChunkWorker.js"); // task code in public folder
    worker.onerror = (err) => {
      console.log("myWorker Error:", err);
    };

    //responsible for handeling the workers response
    worker.onmessage = (e) => {
      if (e.data.regFlow) {
        handleWorkerUserChangeResponse(id, e.data.regFlow);
      } else if (e.data.worldFiller) {
        chunksmadecounter.current.track.count+=e.data.worldFiller.chunkNumbers.length
        if(chunksmadecounter.current.ref){
          chunksmadecounter.current.ref.updateDisplay()
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

  function calcChunkXandYFromId(id){
    let ws = settings.worldSettings.worldSize
    let y = Math.floor(id / ws);
    let x = id - y * ws;
    return {x,y}
  }
  function calcDistBetweenChunksFromIds(l,r){
    let a = calcChunkXandYFromId(l)
    let b = calcChunkXandYFromId(r)
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5;
  }

  function handleWorkerUserChangeResponse(data) {
    let { vertices, uvs, normals, faceIndexMap, count, chunkNumber } = data;
    vertices = new Float32Array(vertices);
    uvs = new Float32Array(uvs);
    normals = new Float32Array(normals);
    cubeFaceIndexesREFlist.current[chunkNumber] = faceIndexMap;

    chunks.current[chunkNumber].draw = { cc: count, vertices, uvs, normals, rere: true };
    // worker.terminate(); //use to kill the workers // unsure if we ever have too
  }
  function handleWorkerWorldFillResponse(worldFiller) {
    REF_ALLCUBES.current = { ...REF_ALLCUBES.current, ...worldFiller.ac };

    worldFiller.chunkNumbers.forEach((cn) => {
      chunks.current[cn] = worldFiller.testor[cn];
      cubeFaceIndexesREFlist.current[cn] = worldFiller.testor[cn].faceIndexMap;
    });
    if (workerPendingJob.current.length == 0) {
      chunksmadecounter.current.loaddone = true;
      chunksmadecounter.current.ref.updateDisplay()
      setFillerLoadDone(true);
    }
  }

  function giveWorkerUserChangeJob(workerId, chunkinfo) {
    let chunkNumber = chunkinfo.chunkNumber;
    let t = 0.5;
    let adjacentchunks = getListOfNearByChunksById(chunkNumber, 1);
    let neededblocks = {};
    adjacentchunks.forEach((cn) => {
      chunks.current[cn].keys.forEach((bn) => {
        neededblocks[bn] = REF_ALLCUBES.current[bn];
      });
    });
    let blocks = neededblocks;
    let chunkBlocks = chunks.current[chunkNumber];
    workerList.current[workerId].postMessage({ t, blocks, chunkBlocks, chunkNumber });
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
        if (type == "worldFill") {
          giveWorkerWorldFillJob(i, chunkinfo);
        } else if (type == "user") {
          giveWorkerUserChangeJob(i, chunkinfo);
        }
      }
    }

    if (!taken) {
      //no worker took new job so Q it up
      workerPendingJob.current.push({ chunkinfo, type, pl: jobTypePriority(type) });
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
    if (job.type == "worldFill") {
      giveWorkerWorldFillJob(workernum, job.chunkinfo);
    } else if (job.type == "user") {
      giveWorkerUserChangeJob(workernum, job.chunkinfo);
    }
  }

  useFrame(() => {
    let px = camera.position.x;
    let pz = camera.position.z;
    let wS = worldSettings.worldSize;
    let cS = worldSettings.chunkSize;
    let pChunk = wS * Math.floor(px / cS) + Math.floor(pz / cS);

    if (playerChunkPosition.current != pChunk && chunksmadecounter.current.loaddone && FillerLoadDoneValue) {
      playerChunkPosition.current = pChunk;
      console.log({pChunk})
      if(calcDistBetweenChunksFromIds(lastRenderChunk.current,pChunk)>=(renderDistPrecentage*(outerViewRadius-viewRadius))){
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
      updateInitStatus({ ...initStatus, buildWorkers: workersmade });
    }
    // triggering world fill once
    if (workerList.current[0] && !chunksmadecounter.current.loaddone) {
      let ourcurrentchunk = settings.startingChunk
      let worldFillarr = getListOfNearByChunksById(ourcurrentchunk, outerViewRadius);
      let ws = worldSettings.worldSize;
      let worldFillarrsort = worldFillarr.map((val) => {
        let ay = Math.floor(val / ws);
        let ax = val - ay * ws;
        let by = Math.floor(ourcurrentchunk / ws);
        let bx = ourcurrentchunk - by * ws;
        let chunkDist = ((ax - bx) ** 2 + (ay - by) ** 2) ** 0.5;
        return { val, dist: chunkDist };
      });
      worldFillarrsort.sort((a, b) => {
        return a.dist - b.dist;
      });
      worldFillarr = worldFillarrsort.map((a) => {
        return a.val;
      });
      let batchnum = Math.floor(worldFillarr.length / fillBatchSize);
      if (worldFillarr.length % fillBatchSize > 0) {
        batchnum++;
      }

      for (let i = 0; i < batchnum; i++) {
        let chunkinfo = {
          arr: worldFillarr.slice(fillBatchSize * i, fillBatchSize * (i + 1)),
        };
        addWorkerJob(chunkinfo, "worldFill");
      }
    }
  }, []);

  function updateDisplayedChunks(currentChunk) {
    let chunksToDisplay = getListOfNearByChunksById(currentChunk, viewRadius);
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
    lastRenderChunk.current = playerChunkPosition.current
    let chunksTofill = getListOfNearByChunksById(currentChunk, outerViewRadius);
    chunksTofill = chunksTofill.filter((cn) => {
      return !chunks.current[cn].count;
    });
    if (chunksTofill.length) {
      let batchnum = Math.floor(chunksTofill.length / fillBatchSize);
      if (chunksTofill.length % fillBatchSize > 0) {
        batchnum++;
      }
      for (let i = 0; i < batchnum; i++) {
        let chunkinfo = {
          arr: chunksTofill.slice(fillBatchSize * i, fillBatchSize * (i + 1)),
        };
        addWorkerJob(chunkinfo, "worldFill");
      }
    }
  }

  function getListOfNearByChunksById(currentchunk, radius) {
    let ws = worldSettings.worldSize;
    let nearby = [];
    let ccy = Math.floor(currentchunk / ws);
    let ccx = currentchunk - ccy * ws;

    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        let ans = currentchunk + ws * y + x;
        //out of map edge
        if (ans < 0 || ans >= ws * ws) {
          continue;
        }

        let ansy = Math.floor(ans / ws);
        let ansx = ans - ansy * ws;

        //out of view
        let chunkDist = ((ansx - ccx) ** 2 + (ansy - ccy) ** 2) ** 0.5;
        if (chunkDist > radius) {
          continue;
        }

        nearby.push(ans);
      }
    }

    nearby = new Array(...new Set(nearby));

    return nearby;
  }

  function showChunks() {
    return !chunksmadecounter.current.loaddone
      ? ""
      : chunks.current.map((ele, ind) => {
          return (
            <Chunk
              key={`cubechunk${ind}`}
              chunkNum={ind}
              chunkProps={chunks}
              activeTextureREF={activeTextureREF}
              cubeFaceIndexesREF={cubeFaceIndexesREFlist}
              REF_ALLCUBES={REF_ALLCUBES}
              addWorkerJob={addWorkerJob}
            />
          );
        });
  }

  return showChunks();
};
