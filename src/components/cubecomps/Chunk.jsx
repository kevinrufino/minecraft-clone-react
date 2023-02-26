import { useFrame, useThree } from "@react-three/fiber";
import { FormCubeArrays } from "./FormCubeArrays";
import * as THREE from "three";
import { useRef } from "react";
import { useState } from "react";

export const Chunk = ({ chunknum, activeTextureREF, chunkprops,REF_ALLCUBES,cubeFaceIndexesREF,addworkerjob }) => {
    const { camera, scene } = useThree();
    const chunkTrackBlockCount=useRef(0)
    const [updateChunk,setUpdateChunk] = useState(false)

    function clickCubeFace(e) {
        e.stopPropagation();
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
          let currBlocks = REF_ALLCUBES.current;
          
          let f_Index = intersect[0].faceIndex;
          f_Index = f_Index - (f_Index % 2);
          
          let currTexture = activeTextureREF.current;
    
          if (e.which === 1) {
            let newblock = cubeFaceIndexesREF.current[chunknum][f_Index].add;
            currBlocks[newblock.key] = { pos: newblock.pos, texture: currTexture };
            chunkprops.keys.push(newblock.key)
            chunkprops.count++
            REF_ALLCUBES.current = currBlocks
          }
    
          if (e.which === 3) {
            let remove = cubeFaceIndexesREF.current[chunknum][f_Index].remove;
            delete currBlocks[remove];
            REF_ALLCUBES.current = currBlocks
            let r_index = chunkprops.keys.indexOf(remove)
            chunkprops.keys[r_index] = chunkprops.keys[chunkprops.keys.length-1]
            chunkprops.keys.length--
            chunkprops.count--
          }
        }
      }

      useFrame (()=>{
        let t = .5
        if(chunkprops.count!=chunkTrackBlockCount.current){
          chunkTrackBlockCount.current=chunkprops.count
          addworkerjob(chunknum)
        }
        if(chunkprops.draw.rere){
          chunkprops.draw.rere= false
          setUpdateChunk(!updateChunk) //triggers a rerender
        }
    })

    function handleEmpty(){
        if(chunkTrackBlockCount.current>0){
            return <FormCubeArrays chunknum={chunknum} chunkprops={chunkprops} clickCubeFace={clickCubeFace} />
        }else{
            return <></>
        }
    }

  return handleEmpty()
};
