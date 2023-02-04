import { useThree } from "@react-three/fiber";
import { FormCubeArrays } from "./FormCubeArrays";
import * as THREE from "three";
import { useRef } from "react";
import { useState } from "react";

export const Chunk = ({ chunknum, activeTextureREF, myblocks,REF_ALLCUBES }) => {
    console.log('i am chunk: ',chunknum, myblocks.count)
    const { camera, scene } = useThree();
    const [bc,setBC] = useState( myblocks.count)

    const cubeFaceIndexesREF = useRef ({});
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
            let newblock = cubeFaceIndexesREF.current[f_Index].add;
            currBlocks[newblock.key] = { pos: newblock.pos, texture: currTexture };
            // updateAllBlocks(currBlocks);
            console.log('bef',myblocks)
            myblocks.keys.push(newblock.key)
            myblocks.count++
            console.log('aft',myblocks)
            REF_ALLCUBES.current = currBlocks
            setBC(bc+1)
          }
    
          if (e.which === 3) {
            let remove = cubeFaceIndexesREF.current[f_Index].remove;
            delete currBlocks[remove];
            // updateAllBlocks(currBlocks);
            REF_ALLCUBES.current = currBlocks
            setBC(bc-1)
          }
        }
      }


    function handleEmpty(){
        if(myblocks.count>0){
            // console.log('i am:',chunknum)
            // return <FormCubeArrays activeTextureREF={testing[chunknum%4]} />
            // console.log(activeTextureREF)
            return <FormCubeArrays activeTextureREF={activeTextureREF} chunkblocks={myblocks} chunkindex={chunknum} REF_ALLCUBES={REF_ALLCUBES} clickCubeFace={clickCubeFace} cubeFaceIndexesREF={cubeFaceIndexesREF} />
        }else{
            return <></>
        }
    }

  return handleEmpty()
};
