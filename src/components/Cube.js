import { useBox } from "@react-three/cannon"
import { useStore } from "../hooks/useStore"
import * as textures from "../images/textures"
import glsl from 'babel-plugin-glsl/macro'
import { useRef } from "react"
import * as THREE from 'three'

export const Cube = ({ position, texture }) => {
    const [ref] = useBox(() => ({
        type: 'Static',
        position
    }))

    const material = useRef()

    

    const [addCube, removeCube, setTexture] = useStore((state) => [state.addCube, state.removeCube, state.setTexture])

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
            <shaderMaterial
                fragmentShader={fShader}
                vertexShader={vShader}
                uniforms={uni}
                attach="material" 
                map={activeTexture}
            />
            {/* <meshStandardMaterial attach="material" map={activeTexture} transparent={true} opacity={texture === 'glass' ? 0.6 : 1} /> */}
        </mesh>
    )
}

const vShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;
const fShader = glsl`
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform vec4 resolution;
uniform float normalEdgeStrength;
uniform float depthEdgeStrength;
varying vec2 vUv;
float getDepth(int x, int y) {
    return texture2D( tDepth, vUv + vec2(x, y) * resolution.zw ).r;
}
vec3 getNormal(int x, int y) {
    return texture2D( tNormal, vUv + vec2(x, y) * resolution.zw ).rgb * 2.0 - 1.0;
}
float depthEdgeIndicator(float depth, vec3 normal) {
    float diff = 0.0;
    diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);
    diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);
    diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);
    diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);
    return floor(smoothstep(0.01, 0.02, diff) * 2.) / 2.;
}
float neighborNormalEdgeIndicator(int x, int y, float depth, vec3 normal) {
    float depthDiff = getDepth(x, y) - depth;
    vec3 neighborNormal = getNormal(x, y);
    
    // Edge pixels should yield to faces who's normals are closer to the bias normal.
    vec3 normalEdgeBias = vec3(1., 1., 1.); // This should probably be a parameter.
    float normalDiff = dot(normal - neighborNormal, normalEdgeBias);
    float normalIndicator = clamp(smoothstep(-.01, .01, normalDiff), 0.0, 1.0);
    
    // Only the shallower pixel should detect the normal edge.
    float depthIndicator = clamp(sign(depthDiff * .25 + .0025), 0.0, 1.0);
    return (1.0 - dot(normal, neighborNormal)) * depthIndicator * normalIndicator;
}
float normalEdgeIndicator(float depth, vec3 normal) {
    
    float indicator = 0.0;
    indicator += neighborNormalEdgeIndicator(0, -1, depth, normal);
    indicator += neighborNormalEdgeIndicator(0, 1, depth, normal);
    indicator += neighborNormalEdgeIndicator(-1, 0, depth, normal);
    indicator += neighborNormalEdgeIndicator(1, 0, depth, normal);
    return step(0.1, indicator);
}
void main() {
    vec4 texel = texture2D( tDiffuse, vUv );
    float depth = 0.0;
    vec3 normal = vec3(0.0);
    if (depthEdgeStrength > 0.0 || normalEdgeStrength > 0.0) {
        depth = getDepth(0, 0);
        normal = getNormal(0, 0);
    }
    float dei = 0.0;
    if (depthEdgeStrength > 0.0) 
        dei = depthEdgeIndicator(depth, normal);
    float nei = 0.0; 
    if (normalEdgeStrength > 0.0) 
        nei = normalEdgeIndicator(depth, normal);
    float Strength = dei > 0.0 ? (1.0 - depthEdgeStrength * dei) : (1.0 + normalEdgeStrength * nei);
    gl_FragColor = texel * Strength;
}
`;

const uni = {
    tDiffuse: { value: null },
    tDepth: { value: null },
    tNormal: { value: null },
    resolution: {
        value: new THREE.Vector2(
          window.innerHeight / window.innerWidth,
          window.innerHeight / window.innerWidth
        )
    },
    normalEdgeStrength: { value: 0 },
    depthEdgeStrength: { value: 0 }
}