import { useSphere } from "@react-three/cannon";
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import settings from "../devOnline";
import { useKeyboard } from "../hooks/useKeyboard";
import { useStore } from "../hooks/useStore";

const JUMP_HIEGHT = 8;
const SPEED = 4;
const QUICKFACTOR = 10;

export const Player = ({myradius = .5}) => {
    const { camera } = useThree();
    const { 
        moveBackward,
        moveForward,
        moveLeft,
        moveRight,
        jump,
        moveQuick
    } = useKeyboard();
    const [ref, api] = useSphere(() => ({
        mass: 0,
        type: 'Dynamic',
        position: settings.startingPositionDefault,
        args:[myradius]
    }))

    const vel = useRef([0,0,0])
    const pos = useRef([0,0,0])
    const [socket,online_sendPos] = useStore((state)=>[state.socket,state.online_sendPos])


    function doMovement(){
        const direction = new Vector3()
        const frontVector = new Vector3(0,0,(moveBackward ? 1 : 0) - (moveForward ? 1 : 0))
        const sideVector = new Vector3( (moveLeft ? 1 : 0) - (moveRight ? 1 : 0), 0, 0 )
        direction
            .subVectors(frontVector, sideVector)
            .normalize()
            .multiplyScalar(SPEED*(moveQuick*QUICKFACTOR+1))
            .applyEuler(camera.rotation)


        //stop player from moving into the negatives
        api.velocity.set(...checkMapLimits(direction))

        // jump
        if (jump && Math.abs(vel.current[1]) < .05) {
            api.velocity.set(vel.current[0], vel.current[1] + JUMP_HIEGHT, vel.current[2])
        }

        // camera follows "player"
        if(!settings.ignoreCameraFollowPlayer){
            camera.position.copy(new Vector3(
                pos.current[0],
                pos.current[1],
                pos.current[2]
                ))
        }
    }

    function checkMapLimits(direction){
        let [x,y,z] = [direction.x,direction.y,direction.z]

        if(pos.current[0]<=0.1){
            x=1
        }
        if(pos.current[0]>=255.1){
            x=-1
        }
        if(pos.current[1]<=0.1){
            y=1
        }
        // if(pos.current[1]>=255.1){
        //     y=-1
        // }
        if(pos.current[2]<=0.1){
            z=1
        }
        if(pos.current[2]>=255.1){
            z=-1
        }

        return [x,y,z]
    }

    function doOnlinePlayerPos(){
        if(settings.online){
            if(socket.connected){
                    online_sendPos(pos.current)
            }
        }
    }

    // wtf is this?
    useEffect(() => {
        api.velocity.subscribe((v) => vel.current = v)
    }, [api.velocity])
    // wtf is this?
    useEffect(() => {
        api.position.subscribe((p) => pos.current = p)
    }, [api.position])
    

    useFrame(() => {
        doOnlinePlayerPos()
        doMovement()
    })

    return (


        <mesh  ref={ref}>
            {/* <boxGeometry attach="geometry" args={[5,5,5]}/> */}
            <sphereGeometry attach="geometry" args={[myradius]}/>
            <meshStandardMaterial attach="material" color="orange" />
        </mesh>
    )
}