import { useEffect, useRef } from "react";

const JoyStick = ({myId,startx,starty,radius, moveBools, sightmovement,physicalmovement, givenWidth, givenHeight})=>{

    let joystickCanvasRef = useRef()
    let info = useRef({
        origx:startx,
        origy:starty,
        currx:startx,
        curry:starty,
        msx:0,
        msy:0,
        isdragging:false,
        sensitivity:12,
        tapsensetime:.5,
        elepos:{}
    })

    useEffect(()=>{
        if(joystickCanvasRef.current){
            info.current.elepos=joystickCanvasRef.current.getBoundingClientRect()
            let canvas = joystickCanvasRef.current
            canvas.addEventListener("touchstart",mousedown)
            canvas.addEventListener("touchend",mouseup)
            canvas.addEventListener("touchmove",mousemove)
            filldraw()
        }
        moveBools.current.moveQuickTT = new Date().getTime()
        moveBools.current.jumpTT = new Date().getTime()
        moveBools.current.camCenterTT = new Date().getTime()

    },[])

    function inshape(x,y,r){
        let xside=info.current.elepos.x+givenWidth
        let yside=info.current.elepos.y+givenHeight
        let dist  = ((x-xside)**2+(y-yside)**2)**.5
        return dist<r
    }
    function resetStick(){
        info.current.isdragging=false
        info.current.curry=info.current.origy
        info.current.currx=info.current.origx
        filldraw()
        adjustOutValues('reset')
    }

    function adjustOutValues(type){
        if(physicalmovement){
            if(type=='reset'){
                moveBools.current.moveQuick = false
                moveBools.current.jump = false
                moveBools.current.moveRight=false
                moveBools.current.moveLeft=false
                moveBools.current.moveForward=false
                moveBools.current.moveBackward=false
    
            }else{
    
                moveBools.current.moveQuick = moveBools.current.moveQuickTC>2
                let data = info.current
                let sense = radius/data.sensitivity
                
                moveBools.current.moveRight=(data.currx-data.origx)>sense
                moveBools.current.moveLeft=(data.currx-data.origx)<-1*sense
                moveBools.current.moveForward=(data.curry-data.origy)<-1*sense
                moveBools.current.moveBackward=(data.curry-data.origy)>sense
            }

        }
        if(sightmovement){
            if(type=='reset'){
                moveBools.current.camRight=false
                moveBools.current.camLeft=false
                moveBools.current.camUp=false
                moveBools.current.camDown=false
                moveBools.current.camCenter=false
    
            }else{
                moveBools.current.camCenter = moveBools.current.camCenterTC>2
                let data = info.current
                let sense = radius/data.sensitivity
                moveBools.current.camRight=(data.currx-data.origx)>sense
                moveBools.current.camLeft=(data.currx-data.origx)<-1*sense
                moveBools.current.camUp=(data.curry-data.origy)<-1*sense
                moveBools.current.camDown=(data.curry-data.origy)>sense
            } 
        }

    }

    function mousedown(e){
        e.preventDefault()
        let st={} //screen touch
        st.x=[...e.changedTouches][0].clientX
        st.y=[...e.changedTouches][0].clientY

        // if clicking within stick circle
        if(inshape(st.x,st.y,radius)){
            info.current.isdragging=true
            info.current.msx=st.x
            info.current.msy=st.y
        }

        if(physicalmovement){
            //rapid taps trackers
            let now  = new Date().getTime()
            let diff = now-moveBools.current.moveQuickTT
            moveBools.current.moveQuickTT=new Date().getTime()
            if(diff<info.current.tapsensetime*1000){
                moveBools.current.moveQuickTC+=1
            }else{
                moveBools.current.moveQuickTC=1
            }
        }
        if(sightmovement){
            let now  = new Date().getTime()
            let diff = now-moveBools.current.camCenterTT
            moveBools.current.camCenterTT=new Date().getTime()
            if(diff<info.current.tapsensetime*1000){
                moveBools.current.camCenterTC+=1
            }else{
                moveBools.current.camCenterTC=1
            }
        }



    }
    function mouseup(e){
        // console.log('---mouseup')
        e.preventDefault()
        resetStick()
    }

    function mousemove(e){
        // console.log("---mosemove")
        e.preventDefault()

        let st={} //screen touch
        st.x=[...e.changedTouches][0].clientX
        st.y=[...e.changedTouches][0].clientY




        if(info.current.isdragging){
            let dx = st.x - info.current.msx
            info.current.msx=st.x
            info.current.currx+=dx
            
            let dy = st.y - info.current.msy
            info.current.msy=st.y
            info.current.curry+=dy

            if(Math.abs(
                ((info.current.origx-info.current.currx)**2+(info.current.origy-info.current.curry)**2)**.5
                )>radius/4){

                info.current.curry-=dy
                info.current.currx-=dx
            }
            filldraw()
            adjustOutValues()
        }
    }
    function mouseout(e){
        console.log('---mouseout')
        e.preventDefault()
        resetStick()
    }

    function filldraw(){
        let canvas = joystickCanvasRef.current
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0,0,canvas.width,canvas.height)
        ctx.beginPath();
        ctx.arc(info.current.origx, info.current.origy, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "blue";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(info.current.origx, info.current.origy, radius/2, 0, 2 * Math.PI);
        ctx.strokeStyle = "red";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(info.current.origx, info.current.origy, radius/info.current.sensitivity, 0, 2 * Math.PI);
        ctx.strokeStyle = "yellow";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(info.current.origx, info.current.origy, radius/4, 0, 2 * Math.PI);
        ctx.strokeStyle = "orange";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(info.current.currx, info.current.curry, radius/2, 0, 2 * Math.PI);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(info.current.currx, info.current.curry, radius/80, 0, 2 * Math.PI);
        ctx.strokeStyle = "black";
        ctx.fillStyle='green'
        ctx.stroke();
        ctx.fill()
    }


    return(<canvas id={myId} ref={joystickCanvasRef} width={startx*2} height={starty*2} className="joystick"  ></canvas>)
}


export default JoyStick;