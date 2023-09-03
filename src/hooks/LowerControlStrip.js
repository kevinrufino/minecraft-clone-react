import JoyStick from "./Joystick";


const LowerControlStrip = ({moveBools})=>{
    let joysize=50
    console.log('move:',moveBools)
    return (<div id="LowerControlStrip">
            <JoyStick  myId={"MoveJoy"} startx={joysize} starty={joysize} radius={joysize*2/3} moveBools={moveBools} physicalmovement={true} overallpos={"left"} givenWidth={joysize} givenHeight={joysize} />
            <JoyStick myId={"SightJoy"} startx={joysize} starty={joysize} radius={joysize*2/3} moveBools={moveBools} sightmovement={true} overallpos={"right"} givenWidth={joysize} givenHeight={joysize} />
    </div>)

}


export default LowerControlStrip;