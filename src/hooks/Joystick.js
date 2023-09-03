import { useEffect, useRef } from "react";

const JoyStick = ({myId,startx,starty,radius, moveBools, sightmovement,physicalmovement, givenWidth, givenHeight})=>{

    let joycanva  = useRef()
    let info = useRef({
        origx:startx,
        origy:starty,
        currx:startx,
        curry:starty,
        msx:0,
        msy:0,
        isdragging:false,
        sensitivity:4,
        tapsensetime:.5,
        elepos:{}
    })

    useEffect(()=>{
        if(joycanva.current){
            console.log('-------------')

            let eleData=joycanva.current.getBoundingClientRect()
            console.log({myId,eleData})
            info.current.elepos=joycanva.current.getBoundingClientRect()
            // info.current.origx=eleData.x+startx
            // info.current.origy=eleData.y+starty
            // info.current.currx=info.current.origx
            // info.current.curry=info.current.origy
            console.log('-------------')
            let can = joycanva.current
            can.addEventListener("pointerdown",mousedown)
            can.addEventListener("pointerup",mouseup)
            can.addEventListener("pointermove",mousemove)
            can.addEventListener("pointerout",mouseout)
            // info.current.currx = startx+
            // console.log({
            //     winy:window.innerHeight,
            //     winx:window.innerWidth,
            //     x:startx,
            //     y:window.innerHeight-starty,
            // })
            filldraw()
        }
        moveBools.current.moveQuickTT = new Date().getTime()
        moveBools.current.jumpTT = new Date().getTime()

    },[])

    function inshape(x,y,r){
        let xside=info.current.elepos.x+givenWidth
        let yside=info.current.elepos.y+givenHeight
        let dist  = ((x-xside)**2+(y-yside)**2)**.5
        // console.log({myId,dist,info,xside,yside})
        // console.log({x,xside},(x-   info.current.elepos.x+givenWidth    ))
        // console.log({y,yside},(y-(  info.current.elepos.y+givenHeight  )))
        // console.log({dist})
        // console.log({myId,xside,yside})
        // let dist  = ((x-info.current.currx)**2+(y-(window.innerHeight-info.current.curry))**2)**.5
        // console.log({dist})

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
                
                // console.log({...moveBools.current})
                // console.log({...data})
                // console.log({sense,x:data.currx-data.origx,y:data.curry-data.origy})
            }

        }
        if(sightmovement){
            if(type=='reset'){
                moveBools.current.camRight=false
                moveBools.current.camLeft=false
                moveBools.current.camUp=false
                moveBools.current.camDown=false
    
            }else{
    
                // moveBools.current.moveJump = moveBools.current.moveJumpTC>2
                let data = info.current
                let sense = radius/data.sensitivity
                
                moveBools.current.camRight=(data.currx-data.origx)>sense
                
                moveBools.current.camLeft=(data.currx-data.origx)<-1*sense
                
                moveBools.current.camUp=(data.curry-data.origy)<-1*sense
                
                moveBools.current.camDown=(data.curry-data.origy)>sense
                
                // console.log({...moveBools.current})
                // console.log({...data})
                // console.log({sense,x:data.currx-data.origx,y:data.curry-data.origy})
            } 
        }

    }

    function mousedown(e){
        console.log("---mouseDown")
        // console.log(e)
        e.preventDefault()
        // if clicking within stick circle
        if(inshape(e.clientX,e.clientY,radius)){
            info.current.isdragging=true
            info.current.msx=e.clientX
            info.current.msy=e.clientY
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
            let diff = now-moveBools.current.moveJumpTT
            moveBools.current.moveJumpTT=new Date().getTime()
            if(diff<info.current.tapsensetime*1000){
                moveBools.current.moveJumpTC+=1
            }else{
                moveBools.current.moveJumpTC=1
            }
        }



    }
    function mouseup(e){
        e.preventDefault()
        resetStick()
    }

    function mousemove(e){
        // console.log("---mosemove")
        e.preventDefault()
        if(info.current.isdragging){
            // console.log(info.current)
            let dx = e.clientX - info.current.msx
            info.current.msx=e.clientX
            info.current.currx+=dx

            let dy = e.clientY - info.current.msy
            info.current.msy=e.clientY
            info.current.curry+=dy

            if(Math.abs(
                ((info.current.origx-info.current.currx)**2+(info.current.origy-info.current.curry)**2)**.5
                )>radius/2){

                info.current.curry-=dy
                info.current.currx-=dx
            }
            filldraw()
            adjustOutValues()
        }
    }
    function mouseout(e){
        e.preventDefault()
        resetStick()
    }

    function filldraw(){
        let canvas = joycanva.current
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



    // console.log(window.innerWidth)
    return(<canvas id={myId} ref={joycanva} width={startx*2} height={starty*2}  ></canvas>)
}


export default JoyStick;