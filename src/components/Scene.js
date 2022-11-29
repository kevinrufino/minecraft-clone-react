import { Effects } from '@react-three/drei';
import { useThree, extend } from '@react-three/fiber';
import { useMemo } from 'react'
import { RenderPixelatedPass } from 'three-stdlib'
import * as THREE from 'three'
import { Player } from './Player'
import { Ground } from './Ground';
import { Cubes } from './Cubes';
import { OtherPlayers } from './OtherPlayers';

extend({ RenderPixelatedPass })

export const Scene = () => {
    const { size, scene, camera } = useThree()
    const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size])
    return (
        <>
            <Player />
            <OtherPlayers />
            <Cubes />
            <Ground />
            {/* <Effects>
                <renderPixelatedPass args={[resolution, 6, scene, camera, { normalEdgeStrength: 1, depthEdgeStrength: 1 }]} />
            </Effects> */}
        </>
    )
}