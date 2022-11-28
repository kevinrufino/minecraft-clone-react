import { useSphere } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";

export const Basicplayer = ({mypos}) => {
    // console.log(mypos)
    const [ref, api] = useSphere(() => ({
        mass: 0,
        args:[1],
        // type: 'static',s
        position: mypos
    }))


    useFrame (() => {
        // console.log(ref.current.position)
        api.position.x = mypos[0]
        // ref.current.position.ya]
        api.position.z = mypos[2]
        console.log(api.position)

    })
    // useEffect(()=>{},[mypos])

    return (
        <>
        {/* // <group ref={ref} position={[2,2,2]}> */}
             {/* <mesh position={mypos} > */}
            {/* <mesh ref={ref} > */}
            <mesh ref={ref}>
                <sphereGeometry attach="geometry" args={[1]}/>
                <meshStandardMaterial attach="material" color="green" />
            </mesh>
        {/* // </group> */}
        </>
    )
}