import { usePlane } from "@react-three/cannon"
import { useStore } from "../hooks/useStore"
import { groundTexture } from "../images/textures"

export const Ground = () => {
    const [ref] = usePlane(() => ({
        rotation: [ -Math.PI / 2, 0, 0],
        position: [ 0, -.5, 0],
    }))

    const [addCube, removeCube] = useStore((state) => [state.addCube, state.removeCube])

    const clickGround = (e) => {
        e.stopPropagation(); //click cannot be passed through the ground
        const [x, y, z] = Object.values(e.point).map(Math.ceil) //TODO: this isn't accurate placing blocked due to it's ciel value
        
        if(e.which === 1){
            addCube(x, y, z)
            return
        }
        if(e.which === 3){
            removeCube(x, y, z)
            return
        }
    }

    groundTexture.repeat.set(100,100)

    return (
        <mesh ref={ref} onClick={clickGround}>
            {/* size of field is 100x100 */}
            <planeGeometry attach='geometry' args={[100,100]} />
            <meshStandardMaterial attach='material' map={groundTexture}/>
        </mesh>
    )
}