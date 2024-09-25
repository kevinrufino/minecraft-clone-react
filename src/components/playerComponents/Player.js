import { useSphere } from "@react-three/cannon";
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react";
import { Vector3, Euler } from "three";
import settings from "../../constants";
import { useKeyboard } from "../../hooks/useKeyboard";
import { useStore } from "../../hooks/useStore";
import { FPV } from "./controls/FPV";

const JUMP_HIEGHT = 8;
const SPEED = 4;
const QUICKFACTOR = 10;

export const Player = ({myradius = .5,moveBools, playerStartingPostion}) => {
    const oneTimeBool = useRef(true)
    const { camera,scene } = useThree();
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
        position: playerStartingPostion,
        rotation: settings.startingRotationDefault,
        args:[myradius]
    }))
    const vel = useRef([0,0,0])
    const pos = useRef(playerStartingPostion)
    const rot = useRef([0,180 *Math.PI/180,0,'YXZ'])
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


        //stop player from moving into the negatives -- outside world boundries
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

    function doMovementWithJoy(){
        const direction = new Vector3()
        const frontVector = new Vector3(0,0,(moveBools.current.moveBackward ? 1 : 0) - (moveBools.current.moveForward ? 1 : 0))
        const sideVector = new Vector3( (moveBools.current.moveLeft ? 1 : 0) - (moveBools.current.moveRight ? 1 : 0), 0, 0 )
        direction
            .subVectors(frontVector, sideVector)
            .normalize()
            .multiplyScalar(SPEED*(moveBools.current.moveQuick*QUICKFACTOR+1))
            .applyEuler(new Euler(...rot.current))
 
        //stop player from moving into the negatives
        api.velocity.set(...checkMapLimits(direction))


        // jump
        // if (jump && Math.abs(vel.current[1]) < .05) {
        //     api.velocity.set(vel.current[0], vel.current[1] + JUMP_HIEGHT, vel.current[2])
        // }

        // camera follows "player"
        if(!settings.ignoreCameraFollowPlayer){
            camera.position.copy(new Vector3(
                pos.current[0],
                pos.current[1],
                pos.current[2]
                ))
        }

        doSightWithJoy()
        
    }

    function checkMapLimits(direction){
        let [x,y,z] = [direction.x,direction.y,direction.z]
        let worldSideLen = settings.worldSettings.chunkSize * settings.worldSettings.worldSize

        if(pos.current[0]<=0.1){
            x=1
        }
        if(pos.current[0]>=worldSideLen-.9){
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
        if(pos.current[2]>=worldSideLen-.9){
            z=-1
        }

        return [x,y,z]
    }

    // meant to help give the server a players location so other players can see where said player is
    function doOnlinePlayerPos(){
        if(settings.onlineEnabled){
            if(socket.connected){
                    online_sendPos(pos.current)
            }
        }
    }

    function doSightWithJoy(){
        if(!settings.ignoreCameraFollowPlayer){
            camera.position.copy(new Vector3(
                pos.current[0],
                pos.current[1],
                pos.current[2]
                ))
        }

        if(!settings.ignoreCameraFollowPlayer){
            // camera.rotation.copy(new Euler(...rot.current))
            // console.log('1',camera.rotation)
            // console.log('2',new Euler(...rot.current))
            if(moveBools.current.camLeft || moveBools.current.camRight){
                // console.log({
                //     a:camera.rotation._y* 180/Math.PI,
                //     x:Math.cos(camera.rotation._y)
                // })
            }
            // console.log({
            //         x:camera.rotation._x *180/Math.PI,
            //         y:camera.rotation._y *180/Math.PI,
            //         z:camera.rotation._z *180/Math.PI,
            //     })
            let hor = moveBools.current.camLeft?1:moveBools.current.camRight?-1:0
            let ver = moveBools.current.camUp?1:moveBools.current.camDown?-1:0
            // api.angularVelocity.set(...[.5*ver,.5*hor,0])
            if(moveBools.current.camCenterTC>2){
                moveBools.current.camCenterTC=0
                rot.current=[...settings.startingRotationDefault,'YXZ']
                // console.log(rot.current)
                // console.log([...settings.startingRotationDefault,'YXZ'])
            }
            if(hor || ver || true){
                rot.current = [
                    // rot.current[0],
                    // rot.current[0]+=.01,
                    rot.current[0]+=.01*ver,
                    // rot.current[0]+=.01*ver*Math.cos(rot.current[1]),
                    // rot.current[1],
                    // rot.current[1]+=.01,
                    rot.current[1]+=.01*hor,
                    rot.current[2],
                    // rot.current[2]+=.01,
                    // rot.current[2]+=.01*ver*Math.sin(rot.current[1]),
                    // rot.current[2]+=.01*ver*Math.sin(rot.current[1]),
                    // rot.current[2]+=.01*ver,
                    'YXZ'
                    // THE ODER SHOULD ALLWAYS BE YAW-PITCH-ROLL
                ]
                rot.current.forEach((val,index)=>{
                    if(index<3){
                        if(val>2*Math.PI){
                            rot.current[index]-=2*Math.PI
                        }
                        if(val<-2*Math.PI){
                            rot.current[index]+=2*Math.PI
                        }
                    }
                })
            }
            // console.log({
            //     // cos:Math.round(Math.cos(rot.current[1])*100)/100,
            //     // sin:Math.round(Math.sin(rot.current[1])*100)/100,
            //     y:rot.current[1]*180/Math.PI
                

            // })
            // console.log(camera.rotation)
            // camera.rotation.copy(new Euler(...rot.current))
            camera.rotation.set(...rot.current)
            // console.log(camera.rotation)
            // camera.rotateOnWorldAxis(new Vector3(0,0,1),rot.current[0]+=.001)
            // let yaw = 50* Math.PI/180
            // let roll = 0* Math.PI/180
            // // let roll = rot.current[0]+=.01
            // let pitch = 0* Math.PI/180
            // let cosP = Math.cos( pitch );
            // let  sinP = Math.sin( pitch );
            // let cosY = Math.cos( yaw );
            // let sinY = Math.sin( yaw );
            // let camlookat = [0,0,0]
            // camlookat[0] = - sinY * cosP;
            // camlookat[1] = sinP;
            // camlookat[2] = - cosY * cosP;
            // // camera.rotateOnWorldAxis( new Vector3( 1, 0, 0 ), yaw );
            // // camera.rotateOnWorldAxis( new Vector3( 0, 1, 0 ), roll );
            // // camera.rotateOnWorldAxis( new Vector3( 0, 0, 1 ), pitch );
            // camera.rotateOnWorldAxis( new Vector3( ...camlookat), roll );

            // api.angularVelocity.set()
        }
        // if(true){
        //     rot.current[1]+=.001
        // }

        // console.log(camera.position)
        // console.log(camera.rotation)
    }

    useEffect(() => {
        api.velocity.subscribe((v) => vel.current = v)
    }, [api.velocity])

    useEffect(() => {
        api.position.subscribe((p) =>{pos.current = p} )
    }, [api.position])
    

    useFrame(() => {
        if(oneTimeBool.current){
            oneTimeBool.current =false
            camera.rotation.copy(new Euler(...[...settings.startingRotationDefault,'YXZ']))
        }
        // doOnlinePlayerPos()
        settings.movewithJOY_BOOL?doMovementWithJoy():doMovement()
    })

    return (
        <>
        {/* THIS IS WHERE THE PLAYER BODY 3JS should go */}
        <mesh  ref={ref}>
            {/* <boxGeometry attach="geometry" args={[5,5,5]}/> */}
            <sphereGeometry attach="geometry" args={[myradius]}/>
            <meshStandardMaterial attach="material" color="orange" />
        </mesh>
        {settings.movewithJOY_BOOL? <></> : <FPV />}
        </>
    )
}