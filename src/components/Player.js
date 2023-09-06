import { useSphere } from "@react-three/cannon";
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react";
import { Vector3, Euler } from "three";
import settings from "../devOnline";
import { useKeyboard } from "../hooks/useKeyboard";
import { useStore } from "../hooks/useStore";

const JUMP_HIEGHT = 8;
const SPEED = 4;
const QUICKFACTOR = 10;

export const Player = ({myradius = .5,moveBools}) => {
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
        // position: [2,1,2],
        position: settings.startingPositionDefault,
        rotation: settings.startingRotationDefault,
        // rotation: [
        //     0 *Math.PI/180,
        //     180 *Math.PI/180,
        //     0],

        args:[myradius]
    }))
// console.log(settings.startingRotationDefault)
// console.log([0 *Math.PI/180,180 *Math.PI/180,0])
    const vel = useRef([0,0,0])
    const pos = useRef([0,0,0])
    const rot = useRef([0,180 *Math.PI/180,0,'XYZ'])
    const ang = useRef([0,0,0])
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

    function doMovementWithJoy(){
        let le=0
        let ri=0
        let fo=0
        let ba =0
        const direction = new Vector3()
        const frontVector = new Vector3(0,0,(moveBools.current.moveBackward ? 1 : 0) - (moveBools.current.moveForward ? 1 : 0))
        const sideVector = new Vector3( (moveBools.current.moveLeft ? 1 : 0) - (moveBools.current.moveRight ? 1 : 0), 0, 0 )
        // const frontVector = new Vector3(0,0,fo?1:ba?-1:0)
        // const sideVector = new Vector3( 0, 0, 0 )
        direction
            .subVectors(frontVector, sideVector)
            .normalize()
            .multiplyScalar(SPEED*(moveBools.current.moveQuick*QUICKFACTOR+1))
            .applyEuler(new Euler(...rot.current))
        // console.log(direction)


            // console.log(direction)
            // console.log(camera.rotation)
        //stop player from moving into the negatives
        api.velocity.set(...checkMapLimits(direction))
        // api.velocity.set(...[
        //     .1,
        //     0,
        //     .1
        // ])

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

    const ti = useRef({
        s:0,
        x:20,
        y:-5,
        z:20,
    })
    function testmorethings(){
        let fo=0
        let ba=0
        let le=0
        let ri=0

        const direction = new Vector3()
        const frontVector = new Vector3(0,0,(ba ? 1 : 0) - (fo ? 1 : 0))
        const sideVector = new Vector3( (le ? 1 : 0) - (ri ? 1 : 0), 0, 0 )
        direction
            .subVectors(frontVector, sideVector)
            .normalize()
            .multiplyScalar(100)
            .applyEuler(camera.rotation)

        
        // if(!settings.ignoreCameraFollowPlayer){
        //     camera.position.copy(new Vector3(
        //         pos.current[0],
        //         pos.current[1],
        //         pos.current[2]
        //         ))
        // }
        // if(ti.current.s<2){
            let sam = ti.current
            // sam.x+=.01
            // console.log(sam)
            // console.log({
            //     x:camera.position.x +direction.x,
            //     y:camera.position.y+direction.y,
            //     z:camera.position.z+direction.z
            // })
            camera.lookAt(
                camera.position.x +direction.x,
                camera.position.y+direction.y,
                camera.position.z+direction.z
            )
            // camera.position.copy(new Vector3(
            //     camera.position.x +direction.x,
            //     camera.position.y+direction.y,
            //     camera.position.z+direction.z
            //     ))

            // console.log(direction)
            // console.log(camera)
            // ti.current.s++
        // }

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
        // console.log(`---position useeffect`)
        api.position.subscribe((p) =>{
            // console.log(p)
            pos.current = p
        } 
        )
    }, [api.position])
    // useEffect(() => {
    //     console.log(`---rotation useeffect`)
    //     api.rotation.subscribe((r) =>{
    //         // console.log(r)
    //         rot.current = r
    //     } 
    //     )
    // }, [api.rotation])
    // useEffect(() => {
    //     console.log(`---angVEL useeffect`)
    //     api.angularVelocity.subscribe((av) =>{
    //         // console.log(r)
    //         ang.current = av
    //     } 
    //     )
    // }, [api.angularVelocity])
    

    useFrame(() => {
        // doOnlinePlayerPos()
        if(false){
            doMovement()
        }else{
            doMovementWithJoy()
            // testmorethings()
            // testorthings2()
        }

        // console.log(scene)
    })

    return (
        <mesh  ref={ref}>
            {/* <boxGeometry attach="geometry" args={[5,5,5]}/> */}
            <sphereGeometry attach="geometry" args={[myradius]}/>
            <meshStandardMaterial attach="material" color="orange" />
        </mesh>
    )
}