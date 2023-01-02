import { useBox } from "@react-three/cannon"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { ShaderMaterial } from "three"
import { HalftoneShader } from "three-stdlib"

export const FlyBlock = ({ position, dg, unis, radius=4, myargs=[1,1,1], ind,clickfunc , color, currDG, moveToDG }) => {
    const [ref,api] = useBox(() => ({
        type: 'Static',
        position,
        args: myargs
    }))

    useFrame(()=>{
        if(ref.current){

            let x=radius *Math.cos( (dg+currDG.current)*Math.PI/180)
            let z=radius *Math.sin( (dg+currDG.current)*Math.PI/180)
            api.position.set(x,0,z)
        }


    })

    return (
        <mesh ref={ref} name={'flycube'} onClick={(e)=>{clickfunc(e,ind)}} onContextMenu={(e)=>{clickfunc(e,ind)}} >
            <boxGeometry attach="geometry" arg={myargs}/>
            <meshStandardMaterial attach="material" color={color} />
        </mesh>
    )
}