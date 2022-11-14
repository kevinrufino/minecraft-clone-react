import { useBox } from "@react-three/cannon"
import { useStore } from "../hooks/useStore"
import * as textures from "../images/textures"

export const Cube = ({ position, texture }) => {
    const [ref] = useBox(() => ({
        type: 'Static',
        position
    }))

    const [addCube, removeCube] = useStore((state) => [state.addCube, state.removeCube])

    const activeTexture = textures[texture + 'Texture']

    const cubeClicked = (e) => {
        e.stopPropagation(); //click cannot be passed through the ground
        const clickedFace = Math.floor(e.faceIndex / 2)
        const {x,y,z} = ref.current.position

        if(e.which === 3) {
            removeCube(x,y,z)
            return
        }
        if(clickedFace === 0 && e.which === 1) { // north? face
            addCube(x+1, y, z)
            return
        }
        if(clickedFace === 1 && e.which === 1) { // south? face
            addCube(x-1, y, z)
            return
        }
        if(clickedFace === 2 && e.which === 1) { // top face
            addCube(x, y+1, z)
            return
        }
        if(clickedFace === 3 && e.which === 1) { // bottom face
            addCube(x, y-1, z)
            return
        }
        if(clickedFace === 4 && e.which === 1) { // east? face
            addCube(x, y, z+1)
            return
        }
        if(clickedFace === 5 && e.which === 1) { // west? face
            addCube(x, y, z-1)
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
