import { useEffect, useRef, useState } from "react";
import { Chunk } from "./Chunk";
import { createNoise2D } from "simplex-noise";
import alea from "alea";

export const Cubes = ({ activeTextureREF,REF_ALLCUBES }) => {
  console.log("-------- rerender Cubes");
  let worldCubeSize =16; //this squareD is the number of chunks rendered
  let worldHeight = 1;

  let workercount = 3; //a set number of workers
  const priorityorder = useRef(0)
  const workerpendingjob = useRef([])
  const workerworking= useRef(new Array(workercount).fill(false))

  const workerlist = useRef(new Array(workercount).fill(""))

  //used to keep track of what to add or remove when a face is clicked
  const cubeFaceIndexesREFlist = useRef(new Array(worldCubeSize ** 2).fill({}))

  const chunks = useRef(new Array(worldCubeSize ** 2).fill()); 
  /* 
    example
    chunks.current is whats  below
      [{
        keys:
        count:
        draw:{ cc,vertices, uvs, normals}
      }
      ,...] 
  */

  // used to insure the useEffect deosn't re add the starting cubes
  const oneTimeBlockLoaderBool = useRef(false);
  

  function makeKey(x, y, z) {
    return x + "." + y + "." + z;
  }

  const buildWorker = (id) => {
    const worker = new window.Worker('./ChunkWorker.js') // task code in public folder
    worker.onerror = (err) =>{console.log('myWorker Error:',err)};
    
    //responsuble for handeling the workers response
    worker.onmessage = (e) => { 
      let { vertices, uvs, normals, faceindexmap, count, chunknumber } = e.data;
      vertices = new Float32Array(vertices);
      uvs = new Float32Array(uvs);
      normals = new Float32Array(normals);
      cubeFaceIndexesREFlist.current[chunknumber] = faceindexmap;
      chunks.current[chunknumber].draw={cc:count,vertices, uvs, normals, rere:true}
      // worker.terminate(); //use to kill the workers

      if(workerpendingjob.current.length>0){ //look for more work
        getpendingjob(id,workerpendingjob.current.shift())
      }else{
        workerworking.current[id] = false
      }

    };
    return worker
  };

  //if there is a new job give it to an open worker if not Q it up
 function addworkerjob(chunknumber){
  let done = false //worker took new job
  for(let i=0;i<workerlist.current.length;i++){
    if(!workerworking.current[i] && !done){
      let t=.5
      let blocks = REF_ALLCUBES.current
      let chunkblocks = chunks.current[chunknumber]
      workerworking.current[i] = true
      done =true
      workerlist.current[i].postMessage({ t,blocks,chunkblocks,chunknumber });
    }

  }

  if(!done){
    //no worker took new job so Q it up
    workerpendingjob.current.push(chunknumber)
  }
  

 }

 function getpendingjob(workernum,chunknumber){
  let t=.5
  let blocks = REF_ALLCUBES.current
  let chunkblocks = chunks.current[chunknumber]
  //give work to worker
  workerlist.current[workernum].postMessage({ t,blocks,chunkblocks,chunknumber });
 }




  //add bulk cubes for testing
  useEffect(() => {
    //this useeffect is for setup a bulk of cubes to test rendor
    // only happens once
    // can be ignored by settings oneTimeBlockLoaderBool to true at the top
    const prng = alea("1000");
    const noise2D = createNoise2D(prng);
    if (!oneTimeBlockLoaderBool.current) {
      let start = {};
      // let xs = worldCubeSize**2;
      let xs = 16
      let ys = 1;
      let zs = xs;
      let heightfactor = 5
      let depth = 2
      let key = "";

      let ty=0 //test y for noise

      for (let x = 0; x < xs; x++){
        for (let y = -1*Math.abs(depth); y < ys; y++) {
          for (let z = 0; z < zs; z++) {
            ty=Math.floor((noise2D(x / 100, z / 100) + 1) *heightfactor/2)+y
            key = makeKey(x, ty, z);
            if(x==0&&z==0){
              console.log(key)
            }
            start[key] = {
              pos: [x, ty, z],
              texture: (Math.abs(x-z)<16)?"wood":"grass",
            };
          }
        }
      }
      REF_ALLCUBES.current = start

      oneTimeBlockLoaderBool.current = true;
    }

    if(!workerlist.current[0]){
      workerlist.current.forEach((ele,ind)=>{
        workerlist.current[ind] = buildWorker(ind)
      })
    }
  }, []);

  function getChunksStartingCubeCount() {
    let wcs = worldCubeSize;
    let wch = worldHeight;
    let ab = REF_ALLCUBES.current; //all blocks
    let abkeys = Object.keys(ab);
    let newchunkarray = new Array(wcs ** 2).fill();
    let newKeyForChunkObject = new Array(wcs ** 2).fill();

    //organize cubes into chunk
    abkeys.forEach((cube) => {
      let [x, y, z] = ab[cube].pos;

      //math for finding out which chunk this x and z coordinate belongs 2
      let chunkid = Math.floor(x / wcs) * wcs + Math.floor(z / wcs);

      if (!newchunkarray[chunkid]) {
        newchunkarray[chunkid] = { count: 0 };
      }
      if (!newKeyForChunkObject[chunkid]) {
        newKeyForChunkObject[chunkid] = { keys: new Array(wcs ** 2 * wch) };
      }
      newKeyForChunkObject[chunkid].keys[newchunkarray[chunkid].count] = cube;
      newchunkarray[chunkid].count += 1;
    });

    
    for (let i = 0; i < newchunkarray.length; i++) {
      if (!newchunkarray[i]) {
        newchunkarray[i] = { count: 0 };
      }
      if (!newKeyForChunkObject[i]) {
        newchunkarray[i]["keys"] = [];
      } else {
        newchunkarray[i]["keys"] = newKeyForChunkObject[i].keys;
      }
      newchunkarray[i]["draw"]={ cc:0, rere:false } //cc=cubecont
    }
    // adding the keys and count properties for each chunk
    chunks.current = newchunkarray;

    return chunks.current.map((ele, ind) => {
      return (
        <Chunk
          key={`cubechunk${ind}`}
          chunknum={ind}
          myblocks={chunks.current[ind]}
          chunkprops={chunks.current[ind]}
          activeTextureREF={activeTextureREF}
          cubeFaceIndexesREF = {cubeFaceIndexesREFlist}
          REF_ALLCUBES={REF_ALLCUBES}
          addworkerjob={addworkerjob}
        />
      );
    });

  
  }

  return getChunksStartingCubeCount();
};
