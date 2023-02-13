import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as textures from "../../images/textures";
import { useStore } from "../../hooks/useStore";
import * as THREE from "three";
import { DrawCubesGeo } from "./DrawCubesGeo";

export const FormCubeArrays = ({ activeTextureREF, chunkblocks, chunkindex,clickCubeFace, REF_ALLCUBES,cubeFaceIndexesREF,chunkprops }) => {
  // console.log('calc cube array:',chunkindex,chunkblocks)
  // const [getAllBlocks, updateAllBlocks] = useStore((state) => [state.getAllBlocks, state.updateAllBlocks]);
  // const [dataCont, setDataCont] = useState([{cc:0}]);
  const DC_delayRef = useRef(0)
  // const [gogo,setGogo] = useState(true)

  function handledata(){

    // console.log('rendering DC with cube count:',dataCont[0].cc)
    // console.log(chunkblocks)
    // if(dataCont[0]){
    //   if(dataCont[0].vertices){
    //     if(dataCont[0].vertices.length>0){
    //       return (
    //         dataCont.map((inst, ind) => {
    //           console.log('yeah boy key',`ACmesh${dataCont[0].cc}-${chunkindex}-${ind}`)
    //           return <DrawCubesGeo info={inst} key={`ACmesh${dataCont[0].cc}-${chunkindex}-${ind}`} clickCubeFace={clickCubeFace} />
    //         })
    //       )
    //     }
    //   }
    // }


    // console.log(`rendering DC-${chunkindex} with cube count:`,chunkprops.draw.cc,chunkprops)
    // console.log(`rendering DC-${chunkindex} with cube count:`,chunkprops.draw.cc)
    if(chunkprops.draw){
      if(chunkprops.draw.vertices){
        if(chunkprops.draw.vertices.length>0){
          return (
            [chunkprops.draw].map((inst, ind) => {
              // console.log('yeah boy key',`ACmesh${chunkprops.draw.cc}-${chunkindex}`)
              return <DrawCubesGeo info={inst} key={`ACmesh${chunkprops.draw.cc}-${chunkindex}`} clickCubeFace={clickCubeFace} />
            })
          )
        }
      }
    }

    return <></>


  }

  return(
    handledata()
  )
};
