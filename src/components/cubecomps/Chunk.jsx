import { useFrame, useThree } from "@react-three/fiber";
import { FormCubeArrays } from "./FormCubeArrays";
import * as THREE from "three";
import { useRef } from "react";
import { useState } from "react";

export const Chunk = ({ chunknum, activeTextureREF, myblocks,REF_ALLCUBES,cubeFaceIndexesREF,addworkerjob,chunkprops }) => {
    // console.log('i am chunk: ',chunknum, myblocks.count)
    const { camera, scene } = useThree();
    // const [bc,setBC] = useState( myblocks.count)
    const bc=useRef(0)
    const [gogo,setGoGo] = useState(false)

    // const cubeFaceIndexesREF = useRef ({});
    function clickCubeFace(e) {
        console.log('---------------------------------------')
        console.log('-------clicked chunk:',chunknum)
        // e.preventDefault()
        e.stopPropagation(); //click cannot be passed through cube face
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        
        let intersect = raycaster.intersectObjects(scene.children);
        
        intersect = intersect.filter((inter) => {
          return inter.object.name == "cubesMesh2";
        });
        
        if (intersect.length > 0) {
          // let currBlocks = getAllBlocks();
          let currBlocks = REF_ALLCUBES.current;
          
          let f_Index = intersect[0].faceIndex;
          f_Index = f_Index - (f_Index % 2);
          
          // console.log('halo boy')
          // console.log(activeTextureREF)
          let currTexture = activeTextureREF.current;
          // console.log('halo boy2')
    
          if (e.which === 1) {
            // console.log(cubeFaceIndexesREF)
            let newblock = cubeFaceIndexesREF.current[chunknum][f_Index].add;
            currBlocks[newblock.key] = { pos: newblock.pos, texture: currTexture };
            // updateAllBlocks(currBlocks);
            // console.log('bef',myblocks)
            myblocks.keys.push(newblock.key)
            myblocks.count++
            // console.log('aft',myblocks)
            REF_ALLCUBES.current = currBlocks
            // addworkerjob(chunknum)
            // setBC(bc+1)
            // bc.current++
          }
    
          if (e.which === 3) {
            let remove = cubeFaceIndexesREF.current[chunknum][f_Index].remove;
            delete currBlocks[remove];
            REF_ALLCUBES.current = currBlocks
            let r_index = myblocks.keys.indexOf(remove)
            myblocks.keys[r_index] = myblocks.keys[myblocks.keys.length-1]
            myblocks.keys.length--

            myblocks.count--
            // updateAllBlocks(currBlocks);
            // setBC(bc-1)
            // bc.current--
          }
        }
      }

      useFrame (()=>{
        let t = .5
        if(myblocks.count!=bc.current){
          // console.log('saw differences in uframe',myblocks.count,bc.current,chunkprops.draw.cc)
          // DC_delayRef.current = chunkblocks.count
          bc.current=myblocks.count
          addworkerjob(chunknum)
          // setBC(myblocks.count)
          // console.log('checking re rendering')
          // myactualrunWorker(t,REF_ALLCUBES.current,chunkblocks)
          // setGogo(!gogo)
        }
        if(chunkprops.draw.rere){
          chunkprops.draw.rere= false
          // setBC(myblocks.count)
          setGoGo(!gogo)
        }
    })

    function handleEmpty(){
        if(bc.current>0){
            // console.log('i am:',chunknum)
            // return <FormCubeArrays activeTextureREF={testing[chunknum%4]} />
            // console.log(activeTextureREF)
            return <FormCubeArrays activeTextureREF={activeTextureREF} chunkblocks={myblocks} chunkindex={chunknum} REF_ALLCUBES={REF_ALLCUBES} chunkprops={chunkprops} clickCubeFace={clickCubeFace} cubeFaceIndexesREF={cubeFaceIndexesREF} />
        }else{
            return <></>
        }
    }

  return handleEmpty()
};
