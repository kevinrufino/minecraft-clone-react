import { useEffect, useRef, useState } from "react";
import { Chunk } from "./Chunk";
import { useFrame, useThree } from "@react-three/fiber";

export const Cubes = ({ activeTextureREF, REF_ALLCUBES }) => {
  console.log("-------- rerender Cubes");
  const { camera } = useThree();
  let worldCubeSize = 16; //this squareD is the number of chunks in map
  let viewRadius = 8; //this number is distance from current place chunks are allowed to exist
  let seed = "robo";
  let heightFactor = 20;
  let worldSettings = {
    "useHeightTextures":true,
    "showFlatWorld":false,
    seed,
    heightFactor

  };

  let workerCount = 3; //a set number of workers
  const workerPendingJob = useRef([]);
  const workerWorking = useRef(new Array(workerCount).fill(false));
  const workerList = useRef(new Array(workerCount).fill(""));

  //used to keep track of what to add or remove when a face is clicked
  const cubeFaceIndexesREFlist = useRef(new Array(worldCubeSize ** 2).fill({}));
  const chunks = useRef(
    new Array(worldCubeSize ** 2).fill().map(() => {
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

  const buildWorker = (id) => {
    const worker = new Worker("./dist/publicChunkWorker.js"); // task code in public folder
    worker.onerror = (err) => {
      console.log("myWorker Error:", err);
    };

    //responsuble for handeling the workers response
    worker.onmessage = (e) => {
      if (!e.data.init) {
        handleWorkerChunkResponse(id, e.data);
      }
    };
    return worker;
  };

  function handleWorkerChunkResponse(id, data) {
    let { vertices, uvs, normals, faceIndexMap, count, chunkNumber, blocksOfChunk, forRefAll } = data;

    vertices = new Float32Array(vertices);
    uvs = new Float32Array(uvs);
    normals = new Float32Array(normals);
    cubeFaceIndexesREFlist.current[chunkNumber] = faceIndexMap;
    if (!everDisplayedChunks.current[chunkNumber]) {
      chunks.current[chunkNumber] = blocksOfChunk;
      chunks.current[chunkNumber].visible = true;
      REF_ALLCUBES.current = { ...REF_ALLCUBES.current, ...forRefAll };
      everDisplayedChunks.current[chunkNumber] = true;
    }

    chunks.current[chunkNumber].draw = { cc: count, vertices, uvs, normals, rere: true };
    // worker.terminate(); //use to kill the workers

    if (workerPendingJob.current.length > 0) {
      //look for more work
      getpendingjob(id, workerPendingJob.current.shift());
    } else {
      workerWorking.current[id] = false;
    }
  }

  //if there is a new job give it to an open worker if not Q it up
  function addWorkerJob(chunkNumber) {
    let done = false; //worker took new job
    for (let i = 0; i < workerList.current.length; i++) {
      if (!workerWorking.current[i] && !done) {
        let t = 0.5;
        let blocks = REF_ALLCUBES.current;
        let chunkBlocks = chunks.current[chunkNumber];
        workerWorking.current[i] = true;
        done = true;
        let ftBool = everDisplayedChunks.current[chunkNumber];
        workerList.current[i].postMessage({ t, blocks, chunkBlocks, chunkNumber, ftBool });
      }
    }

    if (!done) {
      //no worker took new job so Q it up
      workerPendingJob.current.push(chunkNumber);
    }
  }

  function getpendingjob(workernum, chunkNumber) {
    let t = 0.5;
    let blocks = REF_ALLCUBES.current;
    let chunkBlocks = chunks.current[chunkNumber];
    let ftBool = everDisplayedChunks.current[chunkNumber];
    //give work to worker
    workerList.current[workernum].postMessage({ t, blocks, chunkBlocks, chunkNumber, ftBool });
  }

  const playerChunkPosition = useRef(-1);
  useFrame(() => {
    let px = camera.position.x;
    let pz = camera.position.z;
    let ws = worldCubeSize;
    let pChunk = ws * Math.floor(px / ws) + Math.floor(pz / ws);

    if (playerChunkPosition.current != pChunk) {
      // console.log("--------------");
      // console.log('chunk-change',{px,pz,pChunk});
      playerChunkPosition.current = pChunk;
      updateDisplayedChunks(pChunk);
    }
  });

  useEffect(() => {
    if (!workerList.current[0]) {
      workerList.current.forEach((ele, ind) => {
        workerList.current[ind] = buildWorker(ind);
        workerList.current[ind].postMessage({
          init: {worldSettings},
        });
      });
    }
  }, []);

  const activeChunks = useRef([]);
  const everDisplayedChunks = useRef({});

  function updateDisplayedChunks(currentChunk) {
    let chunksToDisplay = getListOfNearByChunksById(currentChunk);

    let removeChunks = activeChunks.current.filter((id) => {
      return !chunksToDisplay.includes(id);
    });
    let newlyDisplayChunks = chunksToDisplay.filter((id) => {
      return !activeChunks.current.includes(id);
    });
    newlyDisplayChunks.forEach((id) => {
      if (!everDisplayedChunks.current[id]) {
        addWorkerJob(id);
      } else {
        chunks.current[id].visible = true;
      }
    });
    removeChunks.forEach((id) => {
      chunks.current[id].visible = false;
    });
    activeChunks.current = chunksToDisplay;
  }

  function getListOfNearByChunksById(currentchunk) {
    let ws = worldCubeSize;
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
    return chunks.current.map((ele, ind) => {
      return (
        <Chunk
          key={`cubechunk${ind}`}
          chunkNum={ind}
          chunkProps={chunks}
          TextureREF={activeTextureREF}
          cubeFaceIndexesREF={cubeFaceIndexesREFlist}
          REF_ALLCUBES={REF_ALLCUBES}
          addWorkerJob={addWorkerJob}
        />
      );
    });
  }

  return showChunks();
};
