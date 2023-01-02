import { useFrame } from "@react-three/fiber"
import { useRef, useState } from "react"
import { FlyBlock } from "./FlyBlock"
import { FlyPaper } from "./FlyPlaper"
import { NadaSpace } from "./NadaSpace"

export const ShowAll = ({ myArgs}) => {
    const allcolors = ['red','green','yellow','blue','purple','white','pink','orange','lightblue']
    const [arr,setArr] = useState(myArgs)
    const currDG = useRef(0)
    const moveToDG= useRef(0)


    function handleClick(e,ind){
        // console.log('which: ',e.which)
        if(e.which == 1){
            console.log('wassup',ind)
            let ot = arr[ind].dg
            console.log(ot)
            moveToDG.current=ot
        }

        if(e.which == 3){
            let newarr = {...arr}
            let newkeys = Object.keys(newarr)
            newkeys.push('b'+(newkeys.length+1))
            // console.log(newkeys)

            newkeys.forEach((ele,ind)=>{
                let obj = {}
                obj['color']=allcolors[ind%10]
                obj['dg']= Math.floor(360/newkeys.length)*(ind)
                newarr[ele]=obj
            })
            // console.log(newarr)
            setArr(newarr)


        }
        // let other = {...arr}
        // delete other[ind]
        // setArr(other) 

        
    }

    useFrame(()=>{

        let mt = moveToDG.current
        let cr = currDG.current%360
        let smalldiff  = Math.abs(Math.abs( mt)-Math.abs(cr))
        // console.log(cr,mt, smalldiff)
        let growby = 1
        if(smalldiff <=2){
            currDG.current=-1*moveToDG.current
            cr=1*moveToDG.current
        }
        if(smalldiff>180){
            growby=5
        }
        if(smalldiff<180){
            growby=1
        }
        if(mt != cr){
            if(mt>cr){
                currDG.current -=growby
            }else{
                currDG.current +=growby
            }
        }


    })

    return (
        <>
        {Object.keys(arr).map((ele,ind,full)=>{
            // console.log(ind,full)

            // if(ind != full.length-1){
            //     return (
            //         <NadaSpace key={`blockkey${ele}`} />
            //     )
            // }
            return(
                // <FlyBlock dg={arr[ele].dg} color={arr[ele].color}  key={`blockkey${ele}`} ind={ele} clickfunc={handleClick} currDG={currDG} moveToDG={moveToDG}  />
                <FlyPaper dg={arr[ele].dg} color={arr[ele].color}  key={`blockkey${ele}`} ind={ele} clickfunc={handleClick} currDG={currDG} moveToDG={moveToDG}  />
            )
        })}
        </>
    )
}