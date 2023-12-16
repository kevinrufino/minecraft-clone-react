import { useEffect, useRef, useState } from "react"
import settings from "../devOnline"



export const LoadingWorldPage = ({buildWorkers,chunksmadecounter,myRef})=>{
    const [timeSoFar,setTSF] = useState(0)

    useEffect(()=>{
        if(!chunksmadecounter.current.loaddone){
            setTimeout(()=>setTSF(timeSoFar+1),1000)
        }
        if(myRef.current){
            // console.log(myRef.current.children[0].textContent)
            chunksmadecounter.current['ref']={
                'ref':myRef.current,
                'updateDisplay': updateDisplay
            }
            
            // console.log(myRef.currnet.children)
        }

    },[timeSoFar])

    function updateDisplay(){
        myRef.current.children[0].textContent = `load done - ${chunksmadecounter.current.loaddone?'true':'false'} -- ${chunksmadecounter.current.track.count}/${chunksmadecounter.current.track.max}`
        // myRef.current.children[1].textContent = ``
        // myRef.current.children[2].textContent = ``

    }
    

return (
    <div ref={myRef}>
    <div id="loadingpage"></div>

    <div id="loadingpage">Building Workers {buildWorkers}</div>
    <div id="loadingpage">Load Time So Far: <span>{timeSoFar}</span>s</div>
    </div>

)

}