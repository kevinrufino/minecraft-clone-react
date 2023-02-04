import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as textures from "../../images/textures";
import { useStore } from "../../hooks/useStore";
import * as THREE from "three";
import { DrawCubesGeo } from "./DrawCubesGeo";

export const FormCubeArrays = ({ activeTextureREF, chunkblocks, chunkindex,clickCubeFace, REF_ALLCUBES,cubeFaceIndexesREF }) => {
  // console.log('calc cube array:',chunkindex,chunkblocks)
  // const [getAllBlocks, updateAllBlocks] = useStore((state) => [state.getAllBlocks, state.updateAllBlocks]);
  const [dataCont, setDataCont] = useState([{cc:0}]);
  const DC_delayRef = useRef(0)

  // const cubeCount = useRef(0);
  





  function makeKey(x, y, z) {
    return x + "." + y + "." + z;
  }

  // function updateDataContainer(blocks) {
  //   let t = 0.5;
  //   // let allkeys = Object.keys(blocks);
  //   // let [vertices, uvs, normals] = genFaceArrays(t, blocks);
  //   // console.log(vertices.length/3)
  //   vertices = new Float32Array(vertices);
  //   uvs = new Float32Array(uvs);
  //   normals = new Float32Array(normals);

  //   let newAC = [];

  //   // newAC.push({
  //   //   vertices,
  //   //   normals,
  //   //   uvs,
  //   //   // allkeys,
  //   // });
  //   // setDataCont(newAC);
  //   return [{
  //     vertices,
  //     normals,
  //     uvs,
  //     // allkeys,
  //   }]
  // }

  const runWorker = (num) => {
    // dispatch({ type: "SET_ERROR", err: "" });
    const worker = new window.Worker('./webworker.js')
    worker.postMessage({ num });
    worker.onerror = (err) => err;
    worker.onmessage = (e) => {
      const { res } = e.data;
      // dispatch({
      //   type: "UPDATE_FIBO",
      //   id,
      //   time,
      //   fibNum,
      // });
      console.log("YOOOOOOOOOOOOOOOOOOOOOOOOOO THE RES IS:",res)
      worker.terminate();
    };
  };

  const myactualrunWorker = (t,blocks,chunkblocks) => {
    // dispatch({ type: "SET_ERROR", err: "" });
    const worker = new window.Worker('./myactualworker.js')
    console.log('Workstart ----')
    worker.postMessage({ t,blocks,chunkblocks });
    worker.onerror = (err) => err;
    worker.onmessage = (e) => {
      let { vertices, uvs, normals, faceindexmap, count } = e.data;
      // console.log('data:',vertices, uvs, normals, faceindexmap)
      console.log(`Worker Response ------`)
      console.log('data:',vertices.length, count )
      // dispatch({
      //   type: "UPDATE_FIBO",
      //   id,
      //   time,
      //   fibNum,
      // });
      vertices = new Float32Array(vertices);
      uvs = new Float32Array(uvs);
      normals = new Float32Array(normals);
      cubeFaceIndexesREF.current = faceindexmap;
      // console.log("YOOOOOOOOOOOOOOOOOOOOOOOOOO THE RES IS:",res)
      setDataCont([{ cc:count,vertices, uvs, normals}])
      worker.terminate();
    };
  };

  useFrame(()=>{
      let t = .5
      if(chunkblocks.count!=DC_delayRef.current){
        console.log('saw differences in uframe',chunkblocks.count,DC_delayRef.current,dataCont[0].cc)
        DC_delayRef.current = chunkblocks.count
        myactualrunWorker(t,REF_ALLCUBES.current,chunkblocks)
      }
  })
  

  useEffect(()=>{
    let t = .5
    console.log('current counts differences:',chunkblocks.count,DC_delayRef.current,dataCont[0].cc)
    // if(once){
    //   // runWorker(6000000)
    //   console.log(`---------------------------changing once`)
    //   setOnce(false)
    // }
    // console.log(`chunkblocks:`,chunkblocks)
    // myactualrunWorker(t,REF_ALLCUBES.current,chunkblocks)
  },[])

  function handledata(){

    console.log('rendering DC with cube count:',dataCont[0].cc)
    console.log(chunkblocks)
    if(dataCont[0]){
      if(dataCont[0].vertices){
        if(dataCont[0].vertices.length>0){
          return (
            dataCont.map((inst, ind) => {
              console.log('yeah boy key',`ACmesh${dataCont[0].cc}-${chunkindex}-${ind}`)
              return <DrawCubesGeo info={inst} key={`ACmesh${dataCont[0].cc}-${chunkindex}-${ind}`} clickCubeFace={clickCubeFace} />;
            })
          )
        }
      }
    }

    return <></>


  }


  // return updateDataContainer(getAllBlocks()).map((inst, ind, full) => {
  //   // console.log('yeah boy')
  //   return <DrawCubesGeo info={inst} key={`ACmesh${chunkblocks.count}-${chunkindex}` + ind} clickCubeFace={clickCubeFace} />;
  // });


  // return updateDataContainer(REF_ALLCUBES.current).map((inst, ind, full) => {
  //   // console.log('yeah boy')
  //   return <DrawCubesGeo info={inst} key={`ACmesh${chunkblocks.count}-${chunkindex}` + ind} clickCubeFace={clickCubeFace} />;
  // });

  return(
    handledata()
  )
};
