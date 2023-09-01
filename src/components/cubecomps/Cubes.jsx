import { useEffect, useRef, useState } from "react";
import { Chunk } from "./Chunk";
import { useFrame, useThree } from "@react-three/fiber";

export const Cubes = ({activeTextureREF,REF_ALLCUBES,updateInitStatus,initStatus,chunksmadecounter}) => {
  console.log("-------- rerender Cubes");
  const { camera } = useThree();
  const [FillerLoadDoneValue, setFillerLoadDone] = useState(false);
  let worldChunkSize = 16; //this squareD is the number of chunks in map
  let viewRadius = 10; //this number is distance from current place chunks are allowed to exist
  let seed = "robo";

  let worldSettings = {
    useHeightTextures: false,
    showFlatWorld: false,
    seed,
    heightFactor: 20,
    depth: 1,
  };

  // i believe for most machines 4 is the limit but i am using 3 to be safe
  let workerCount = 1; //a set number of workers
  const workerPendingJob = useRef([]);
  const workerWorking = useRef(new Array(workerCount).fill(true));
  const workerList = useRef(new Array(workerCount).fill(""));

  //used to keep track of what to add or remove when a face is clicked
  const cubeFaceIndexesREFlist = useRef(new Array(worldChunkSize ** 2).fill({}));
  const chunks = useRef(
    new Array(worldChunkSize ** 2).fill().map(() => {
      return new Object({ count: 0, draw: { cc: 0, rere: false } });
    })
  );
  /* 
    example
    chunks.current is whats  below
      [{
        keys:
        count:
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

    //responsuble for handeling the workers response
    worker.onmessage = (e) => {
      if (e.data.singleChunkResponse) {
        handleWorkerChunkResponse(id, e.data.singleChunkResponse);
      } else if (e.data.worldFiller) {
        REF_ALLCUBES.current = { ...REF_ALLCUBES.current, ...e.data.worldFiller.ac };
        e.data.worldFiller.chunkNumbers.forEach((cn) => {
          chunks.current[cn] = e.data.worldFiller.testor[cn];
          cubeFaceIndexesREFlist.current[cn] = e.data.worldFiller.testor[cn].faceIndexMap;
        });
        chunksmadecounter.current.loaddone = true;
        setFillerLoadDone(true);
      } else if (e.data.init) {
        workerWorking.current[id] = false;
        if (workerPendingJob.current.length > 0) {
          getPendingJob(id, workerPendingJob.current.shift());
        }
      }
    };
    return worker;
  };

  function handleWorkerChunkResponse(id, data) {
    let { vertices, uvs, normals, faceIndexMap, count, chunkNumber } = data;
    console.log(`rec: ${chunkNumber}`);
    vertices = new Float32Array(vertices);
    uvs = new Float32Array(uvs);
    normals = new Float32Array(normals);
    cubeFaceIndexesREFlist.current[chunkNumber] = faceIndexMap;

    chunks.current[chunkNumber].draw = { cc: count, vertices, uvs, normals, rere: true };
    // worker.terminate(); //use to kill the workers
    console.log(workerPendingJob.current);
    if (workerPendingJob.current.length > 0) {
      //look for more work
      getPendingJob(id, workerPendingJob.current.shift());
    } else {
      workerWorking.current[id] = false;
    }
  }

  //if there is a new job give it to an open worker if not Q it up
  function addWorkerJob(chunkNumber) {
    let taken = false; //worker took new job
    for (let i = 0; i < workerList.current.length; i++) {
      if (!workerWorking.current[i] && !taken) {
        let t = 0.5;
        let blocks = REF_ALLCUBES.current;
        let chunkBlocks = chunks.current[chunkNumber];
        workerWorking.current[i] = true;
        taken = true;
        workerList.current[i].postMessage({ t, blocks, chunkBlocks, chunkNumber });
      }
    }

    if (!taken) {
      //no worker took new job so Q it up
      workerPendingJob.current.push(chunkNumber);
    }
  }

  function getPendingJob(workernum, chunkNumber) {
    let t = 0.5;
    let blocks = REF_ALLCUBES.current;
    let chunkBlocks = chunks.current[chunkNumber];
    //give work to worker
    workerList.current[workernum].postMessage({ t, blocks, chunkBlocks, chunkNumber });
  }

  
  useFrame(() => {
    let px = camera.position.x;
    let pz = camera.position.z;
    let ws = worldChunkSize;
    let pChunk = ws * Math.floor(px / ws) + Math.floor(pz / ws);

    if (playerChunkPosition.current != pChunk && chunksmadecounter.current.loaddone) {
      // console.log("--------------");
      // console.log("######################################################chunk-change", { px, pz, pChunk });
      playerChunkPosition.current = pChunk;
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
      workerList.current[0].postMessage({
        fillWorld: new Array(worldChunkSize**2).fill(0).map((_, ind) => {
          return ind;
        }),
      });
    }
  }, []);

  function updateDisplayedChunks(currentChunk) {
    let chunksToDisplay = getListOfNearByChunksById(currentChunk);

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

  function getListOfNearByChunksById(currentchunk) {
    let ws = worldChunkSize;
    let nearby = [];
    let ccy = Math.floor(currentchunk / ws);
    let ccx = currentchunk - ccy * ws;

    for (let x = -viewRadius; x <= viewRadius; x++) {
      for (let y = -viewRadius; y <= viewRadius; y++) {
        let ans = currentchunk + ws * y + x;
        //out of map edge
        if (ans < 0 || ans > ws * ws) {
          continue;
        }

        let ansy = Math.floor(ans / ws);
        let ansx = ans - ansy * ws;

        //out of view
        let chunkDist = ((ansx - ccx) ** 2 + (ansy - ccy) ** 2) ** 0.5;
        if (chunkDist > viewRadius) {
          continue;
        }

        nearby.push(ans);
      }
    }
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
