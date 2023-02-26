import { DrawCubesGeo } from "./DrawCubesGeo";

export const FormCubeArrays = ({chunknum, clickCubeFace, chunkprops }) => {

  function handledata(){
    if(chunkprops.draw){
      if(chunkprops.draw.vertices){
        if(chunkprops.draw.vertices.length>0){
          return (
            [chunkprops.draw].map((inst) => {
              return <DrawCubesGeo info={inst} key={`ACmesh${chunkprops.draw.cc}-${chunknum}`} clickCubeFace={clickCubeFace} />
            })
          )
        }
      }
    }

    return <></>


  }

  return(
    handledata()
  )
};
