import { useBox } from "@react-three/cannon"
import { useStore } from "../hooks/useStore"
import * as textures from "../images/textures"
import settings from "../devOnline"
export const Cube = ({ position, texture }) => {
    const [ref] = useBox(() => ({
        type: 'Static',
        position
    }))

    const [addCube, removeCube,online_addCube, online_removeCube] = useStore((state) => [state.addCube, state.removeCube,state.online_addCube, state.online_removeCube])

    const activeTexture = textures[texture + 'Texture']

    const cubeClicked = (e) => {
        e.stopPropagation(); //click cannot be passed through the ground
        const clickedFace = Math.floor(e.faceIndex / 2)
        const {x,y,z} = ref.current.position
        
        console.log('online?',settings.online)
        if(e.which === 3) {
            settings.online?online_removeCube(x,y,z):removeCube(x,y,z)
            return
        }
        if(clickedFace === 0 && e.which === 1) { // north? face
            settings.online?online_addCube(x+1, y, z):addCube(x+1, y, z)
            return
        }
        if(clickedFace === 1 && e.which === 1) { // south? face
            settings.online?online_addCube(x-1, y, z):addCube(x-1, y, z)
            return
        }
        if(clickedFace === 2 && e.which === 1) { // top face
            settings.online?online_addCube(x, y+1, z):addCube(x, y+1, z)
            return
        }
        if(clickedFace === 3 && e.which === 1) { // bottom face
            settings.online?online_addCube(x, y-1, z):addCube(x, y-1, z)
            return
        }
        if(clickedFace === 4 && e.which === 1) { // east? face
            settings.online?online_addCube(x, y, z+1):addCube(x, y, z+1)
            return
        }
        if(clickedFace === 5 && e.which === 1) { // west? face
            settings.online?online_addCube(x, y, z-1):addCube(x, y, z-1)
            return
        }
    }

    return (
        <mesh ref={ref} onClick={cubeClicked}>
            <boxGeometry attach="geometry" />
            <meshStandardMaterial attach="material" map={activeTexture} transparent={true} opacity={texture === 'glass' ? 0.6 : 1} />
        </mesh>
    )
}
