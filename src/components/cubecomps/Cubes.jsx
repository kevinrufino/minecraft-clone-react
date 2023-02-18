import { useEffect, useRef, useState } from "react";
import { useStore } from "../../hooks/useStore";
import { Chunk } from "./Chunk";
import { TestPlaceHolder } from "./TestPlaceHolder";
import { createNoise2D } from "simplex-noise";
import alea from "alea";

// https://www.smashingmagazine.com/2020/10/tasks-react-app-web-workers/

export const Cubes = ({ activeTextureREF,REF_ALLCUBES }) => {
  console.log("-------- rerender Cubes");
  // const [getAllBlocks, updateAllBlocks] = useStore((state) => [state.getAllBlocks, state.updateAllBlocks]);
  // const [updateAllBlocks] = useStore((state) => [state.updateAllBlocks]);
  // const [arr,setArr] = useState (new Array(9).fill(0))
  let worldCubeSize =16;
  let worldHeight = 1;
  let workercount = 3;
  const priorityorder = useRef(0)
  const workerpendingjob = useRef([])
  const workerworking= useRef(new Array(workercount).fill(false))

  const workerlist = useRef(new Array(workercount).fill(""))
  const cubeFaceIndexesREFlist = useRef(new Array(worldCubeSize ** 2).fill({}))
  const chunks = useRef(new Array(worldCubeSize ** 2).fill());
  /* chunks.current is whats  below
    [{
      keys:
      count:
      draw:{ cc,vertices, uvs, normals}
    }
    ,...] */
  const addedblocks = useRef(false);
  

  function makeKey(x, y, z) {
    return x + "." + y + "." + z;
  }

  const myactualrunWorker = (id) => {
    // const myactualrunWorker = (t,blocks,chunkblocks) => {
    // dispatch({ type: "SET_ERROR", err: "" });
    const worker = new window.Worker('./myactualworker.js')
    console.log('Building Workers ----')
    // worker.postMessage({ t,blocks,chunkblocks,chunkoperationnum });
    worker.onerror = (err) =>{console.log('myWorker Error:')};
    worker.onmessage = (e) => {
      let { vertices, uvs, normals, faceindexmap, count, chunknumber } = e.data;
      // console.log('data:',vertices, uvs, normals, faceindexmap)
      // console.log(`Worker (${id}) Response ------ for ${chunknumber}`)
      // console.log('data:',vertices.length, count )
      // dispatch({
        //   type: "UPDATE_FIBO",
        //   id,
        //   time,
        //   fibNum,
        // });
        vertices = new Float32Array(vertices);
        uvs = new Float32Array(uvs);
        normals = new Float32Array(normals);
        cubeFaceIndexesREFlist.current[chunknumber] = faceindexmap;
        // console.log('faceindexmap',cubeFaceIndexesREFlist.current[0])
      // console.log("YOOOOOOOOOOOOOOOOOOOOOOOOOO THE RES IS:",res)
      // setDataCont([{ cc:count,vertices, uvs, normals}])
      chunks.current[chunknumber].draw={cc:count,vertices, uvs, normals, rere:true}
      // worker.terminate();

      //look for more work
      if(workerpendingjob.current.length>0){
        getpendingjob(id,workerpendingjob.current.shift())
      }else{
        workerworking.current[id] = false
      }

    };
    return worker
  };

 function addworkerjob(chunknumber){
  // console.log(`----------adding job to worker from: ${chunknumber}`)
  

  let done = false
  for(let i =0;i<workerlist.current.length;i++){

    if(!workerworking.current[i] && !done){
      let t=.5
      // blocks
      let blocks = REF_ALLCUBES.current
      //chunkblocks
      let chunkblocks = chunks.current[chunknumber]
      // console.log(workerworking)
      workerworking.current[i] = true
      done =true
      workerlist.current[i].postMessage({ t,blocks,chunkblocks,chunknumber });
    }

  }

  if(!done){
    workerpendingjob.current.push(chunknumber)
  }
  

 }

 function getpendingjob(workernum,chunknumber){
  // console.log('getting work from pending list')
  // console.log(workerpendingjob)
  let t=.5
  // blocks
  let blocks = REF_ALLCUBES.current
  //chunkblocks
  let chunkblocks = chunks.current[chunknumber]
  //chunknum
  // console.log(chunkblocks)
  workerlist.current[workernum].postMessage({ t,blocks,chunkblocks,chunknumber });
 }




  //add bulk cubes for testing
  useEffect(() => {
    //this useeffect is for setup a bulk of cubes to test rendor
    //only happens once
    // can be ignored by settings addedblocks to true at the top
    const prng = alea("1000");
    const noise2D = createNoise2D(prng);
    if (!addedblocks.current) {
      let start = {};
      // let xs = worldCubeSize**2;
      let xs = 16*5
      let ys = 1;
      let zs = xs;
      let t = 0.5;
      let yminus = 0
      let key = "";

      let test= 0
      let ty=0

      for (let x = 0; x < xs; x++) {
        for (let y = yminus; y < ys; y++) {
          for (let z = 0; z < zs; z++) {
            test=(noise2D(x / 100, z / 100) + 1) *5
            // console.log(test-test%1)
            ty=test-test%1
            key = makeKey(x, ty, z);
            start[key] = {
              pos: [x, ty, z],
              texture: (Math.abs(x-z)<16)?"wood":"grass",
            };
          }
        }
      }

      // updateAllBlocks(start);
      REF_ALLCUBES.current = start

      addedblocks.current = true;
    }

    if(!workerlist.current[0]){
      workerlist.current.forEach((ele,ind)=>{
        workerlist.current[ind] = myactualrunWorker(ind)
      })


      console.log('worker list',workerlist)

    }
  }, []);

  function getChunksStartingCubeCount() {
    let wcs = worldCubeSize;
    let wch = worldHeight;
    // let ab = getAllBlocks();
    let ab = REF_ALLCUBES.current;
    let abkeys = Object.keys(ab);
    let newarr = new Array(wcs ** 2).fill();
    let newkeys = new Array(wcs ** 2).fill();

    abkeys.forEach((cube, index) => {
      let [x, y, z] = ab[cube].pos;
      // console.log( cube)
      // console.log( Math.floor(x/wcs),Math.floor(z/wcs))
      let c = Math.floor(x / wcs) * wcs + Math.floor(z / wcs);
      // console.log(`${x}.${y}.${z} - chunk: ${ c}`)
      if (!newarr[c]) {
        // console.log('nada')
        newarr[c] = { count: 0 };
      }
      if (!newkeys[c]) {
        newkeys[c] = { keys: new Array(wcs ** 2 * wch) };
      }
      // console.log(c)
      // console.log('what',newkeys[c])
      newkeys[c].keys[newarr[c].count] = cube;
      newarr[c].count += 1;
    });
    for (let i = 0; i < newarr.length; i++) {
      if (!newarr[i]) {
        newarr[i] = { count: 0 };
      }
      if (!newkeys[i]) {
        newarr[i]["keys"] = [];
      } else {
        newarr[i]["keys"] = newkeys[i].keys;
      }
      newarr[i]["draw"]={ cc:0, rere:false}
    }
    // adding the keys and count properties for each chunk
    chunks.current = newarr;
    // console.log(chunks.current)

    return chunks.current.map((ele, ind) => {
      // if (ind == 4) {
      //   return <TestPlaceHolder key={`TPH${ind}-${ele}`} />;
      // }
      // console.log('cunk',activeTextureREF)
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

    return (
      
      <>
        <Chunk
          chunknum={0}
          myblocks={chunks.current[0]}
          chunkprops={chunks.current[0]}
          activeTextureREF={activeTextureREF}
          cubeFaceIndexesREF = {cubeFaceIndexesREFlist}
          REF_ALLCUBES={REF_ALLCUBES}
          addworkerjob={addworkerjob}
        />
        <Chunk
          chunknum={8}
          myblocks={chunks.current[8]}
          chunkprops={chunks.current[8]}
          activeTextureREF={activeTextureREF}
          cubeFaceIndexesREF = {cubeFaceIndexesREFlist}
          REF_ALLCUBES={REF_ALLCUBES}
          addworkerjob={addworkerjob}
        />
      </>
    );
  }

  return getChunksStartingCubeCount();
};
