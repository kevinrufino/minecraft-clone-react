import { useEffect, useRef, useState } from "react"



export const LoadingWorldPage = ({buildWorkers,chunksmadecounter})=>{
    const [timeSoFar,setTSF] = useState(0)

    useEffect(()=>{
        if(!chunksmadecounter.current.loaddone){
            setTimeout(()=>setTSF(timeSoFar+1),1000)
        }

    },[timeSoFar])

return (
    <>
    <div id="loadingpage">load done - {chunksmadecounter.current.loaddone?'true':'false'}</div>

    <div id="loadingpage">Building Workers {buildWorkers}</div>
    {/* <div id="loadingpage">Initializing world: Chunks made <span ref={myRef}></span></div> */}
    <div id="loadingpage">Load Time So Far: <span>{timeSoFar}</span>s</div>
    </>

)

}