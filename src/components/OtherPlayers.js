
import { useEffect } from "react"
import { useStore } from "../hooks/useStore"
import { Basicplayer } from "./BasicPlayer"


export const OtherPlayers =()=>{
    const [players,online_setPlayersPos,socket] = useStore ((state)=>[state.players,state.online_setPlayersPos,state.socket])



    useEffect(()=>{},[players])
    // console.log('-')


    return(
        <>
        {/* {console.log(players)} */}
        {/* {players.map((player,index)=>{
            return <Basicplayer mypos={player.pos} key={`player${2+index}`}/>
        })

        } */}
        {Object.keys(players).map((pn,index)=>{
            return <Basicplayer mypos={players[pn].pos} key={`player${2+index}`}/>
        })}
        </>
    )

}