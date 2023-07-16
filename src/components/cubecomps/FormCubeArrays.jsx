import { DrawCubesGeo } from "./DrawCubesGeo";

export const FormCubeArrays = ({chunkNum, clickCubeFace, chunkProps }) => {

  function handledata(){
    if(chunkProps.draw){
      if(chunkProps.draw.vertices){
        if(chunkProps.draw.vertices.length>0){
          return (
            [chunkProps.draw].map((inst) => {
              return <DrawCubesGeo info={inst} key={`ACmesh${chunkProps.draw.cc}-${chunkNum}`} clickCubeFace={clickCubeFace} />
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
