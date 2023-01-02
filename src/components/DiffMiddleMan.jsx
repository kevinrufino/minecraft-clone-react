import { useEffect, useState } from "react"
import { useRef } from "react"
import { DiffRigid } from "./DiffRigid"
import * as textures from '../images/textures'
import settings from "../devOnline";



export const DiffMiddleMan= ({info,clickCubeFace})=>{
    const cubeTextures = textures['allMincraftTexture']
    // const CTM = textures['AMTmap']

    const theMeshRef = useRef()
    const [doRig,setDoRig] = useState(false)


    function showGeo(){
        return(
            <mesh ref={theMeshRef} onClick={clickCubeFace} onContextMenu={clickCubeFace} name="cubesMesh2">
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" array={info.vertices} count={info.vertices.length / 3} itemSize={3} />
              <bufferAttribute attach="attributes-uv" array={info.uvs} count={info.uvs.length / 2} itemSize={2} />
              <bufferAttribute attach="attributes-normal" array={info.normals} count={info.normals.length / 3} itemSize={3} />
            </bufferGeometry>
            <meshStandardMaterial
              attach="material"
              map={cubeTextures}
            />
        </mesh>
        )
    }

    useEffect(()=>{ //this is neccessary so that after theMeshRef happens, rigid bodies can be calculated
        // console.log('maybe?')
        if(theMeshRef.current){
            if(!doRig){
                setDoRig(true)
            }
        }
    },[theMeshRef.current])

    function showRigid(){
        // console.log("SHOW RIGID???")
        if(theMeshRef.current){

        return(
            <DiffRigid orig_geo={theMeshRef.current.geometry} />
            )
        }
    }

    return(
        <>
        {showGeo()}
        {settings.ignoreCubeRigidBody?<></>:showRigid()}
        </>
    )
}