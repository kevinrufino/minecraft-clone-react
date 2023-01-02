import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { NadaSpace } from "../helpkev/NadaSpace";
import { DiffMiddleMan } from "./DiffMiddleMan";
import * as textures from "../images/textures"
import { useStore } from "../hooks/useStore";
import * as THREE from 'three'


export const DiffCubes = ({activeTexturePatchFix}) => {
  const [getAllBlocks, updateAllBlocks] = useStore((state) => [state.getAllBlocks,state.updateAllBlocks]);
  const [AC,setAC] = useState([]); //AC means the allcubes array of object
  const { camera,scene } = useThree();

  const addedblocks = useRef(false)
  const cubeCount = useRef(0)
  const cubeFaceIndexesREF = useRef({});
  
  function copyOverArray(into, from) {
    from.forEach((ele, ind) => {
      into[ind] = ele;
    });
    return into;
  }

  function makeFaceIndexMapObject(cen,nx,ny,nz){
    return{
      remove:cen,
      add:{
        key:makeKey(nx,ny,nz),
        pos:[nx,ny,nz]
      }
    }
  }

  function genFaceArrays(t, allkeys, blocks) {
    let t2 = 2 * t;
    let vertices = [];
    let uvs = [];
    let normals = [];
    
    let uvSize = 1/2/2/2/2
    let faceindexmap = {
      // 0:{
      //   remove:'1.0.1',
      //   add:{
      //     key: '1.2.1',
      //     pos: [x, y, z]
      //   },
      // }
    };
    let facemapcount = 0;

    allkeys.forEach((cen) => {

      let [nx, ny, nz] = cen.split(".");
      let [x, y, z] = blocks[cen].pos;
      let showfaces = [false, false, false, false, false, false];
      let currtexture = blocks[cen].texture
      let uvL = (textures['AMTmap'][currtexture][0]-1)*uvSize
      let uvB = (textures['AMTmap'][currtexture][1]-1)*uvSize

      let onefaceuv = [
        //uv means UxV meaning (u,v) meaning u is the x cordinate v is the y
        uvL+uvSize, uvB+0, uvL+uvSize, uvB+uvSize, uvL+0, uvB+0, uvL+0, uvB+0, uvL+uvSize, uvB+uvSize, uvL+0, uvB+uvSize,
      ];

      nx = Number(nx);
      ny = Number(ny);
      nz = Number(nz);

      let c = {}; // c = corners
      c[1] = [x + t, y - t, z + t];
      c[2] = [x - t, y - t, z + t];
      c[3] = [x - t, y + t, z + t];
      c[4] = [x + t, y + t, z + t];
      c[5] = [x + t, y - t, z - t];
      c[6] = [x - t, y - t, z - t];
      c[7] = [x - t, y + t, z - t];
      c[8] = [x + t, y + t, z - t];

      let dbstr = "";

      // //front
      if (!blocks[makeKey(nx, ny, nz + t2)]) {
        showfaces[0] = true;
        vertices.push(...c[1], ...c[4], ...c[2]);
        vertices.push(...c[2], ...c[4], ...c[3]);
        normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "front\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx, ny, nz + 1);
        facemapcount += 2;
      }
      // //back
      if (!blocks[makeKey(nx, ny, nz - t2)]) {
        vertices.push(...c[6], ...c[7], ...c[5]);
        vertices.push(...c[5], ...c[7], ...c[8]);
        normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "back\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx, ny, nz - 1);
        facemapcount += 2;
      }
      // //left
      if (!blocks[makeKey(nx - t2, ny, nz)]) {
        vertices.push(...c[2], ...c[3], ...c[6]);
        vertices.push(...c[6], ...c[3], ...c[7]);
        normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "left\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx - 1, ny, nz);
        facemapcount += 2;
      }
      // //right
      if (!blocks[makeKey(nx + t2, ny, nz)]) {
        vertices.push(...c[5], ...c[8], ...c[1]);
        vertices.push(...c[1], ...c[8], ...c[4]);
        normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "right\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx + 1, ny, nz);
        facemapcount += 2;
      }
      // //top
      if (!blocks[makeKey(nx, ny + t2, nz)]) {
        vertices.push(...c[4], ...c[8], ...c[3]);
        vertices.push(...c[3], ...c[8], ...c[7]);
        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "top\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx, ny + 1, nz);
        facemapcount += 2;
      }
      // //bot
      if (!blocks[makeKey(nx, ny - t2, nz)]) {
        vertices.push(...c[5], ...c[1], ...c[6]);
        vertices.push(...c[6], ...c[1], ...c[2]);
        normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        uvs.push(...onefaceuv);
        dbstr = dbstr + "bot\n";
        faceindexmap[facemapcount] = makeFaceIndexMapObject(cen, nx, ny - 1, nz);
        facemapcount += 2;
      }

      blocks[cen].showface = showfaces;
    });

    cubeFaceIndexesREF.current = faceindexmap;

    return [vertices, uvs, normals];
  }

  function makeKey(x, y, z) {
    // console.log('vals',x,y,z)
    // console.log(x+'.'+y+'.'+z)
    return x + "." + y + "." + z;
  }

  function addToAC(blocks) {
    let t = 0.5;
    let allkeys = Object.keys(blocks);
    let [vertices, uvs, normals,faceTextures] = genFaceArrays(t, allkeys, blocks);
    vertices = new Float32Array(vertices)
    uvs = new Float32Array(uvs)
    normals = new Float32Array(normals)

    let newAC = [...AC]


    newAC.push({
      vertices,
      normals,
      uvs,
      allkeys,
    });
    setAC(newAC)
  }

  function clickCubeFace(e){
    // console.log('clickevent:simple',e)

      // e.preventDefault()
      e.stopPropagation(); //click cannot be passed through the ground
      var raycaster = new THREE.Raycaster();
      var mouse = new THREE.Vector2();
      mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1
      mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1
      raycaster.setFromCamera( mouse, camera )
      // console.log('ray: ',raycaster)
      let intersect = raycaster.intersectObjects(scene.children)
      // console.log('bef-intersect: ',intersect)
      intersect = intersect.filter((inter)=>{
        return inter.object.name=="cubesMesh2"
      })




      if(intersect.length>0){

          // if(intersect[0].object.name == "cubesMesh2"){
              console.log('from click cubeFI: ',cubeFaceIndexesREF)
              let currBlocks = getAllBlocks()
              
              let f_Index = intersect[0].faceIndex
              f_Index=f_Index - f_Index%2
          
              console.log('currBlocks',currBlocks)
              console.log('bef',currBlocks)
          
              let currTexture = activeTexturePatchFix.current
              
              if(e.which === 1){
                console.log('click was a 1')
                console.log('f_index',f_Index)
                let newblock = cubeFaceIndexesREF.current[f_Index].add
                // console.log('newblock',newblock,activeTexture)
                currBlocks[newblock.key]={'pos':newblock.pos,'texture':currTexture}
                console.log('blocks after add',currBlocks)
                  updateAllBlocks(currBlocks)
              }



              
              if(e.which === 3){
                  console.log('click was a 3')
              //   console.log('f_Index',f_Index)
              //   console.log('cubefaceindexes',cubeFaceIndexes.current)
                let remove = cubeFaceIndexesREF.current[f_Index].remove
                console.log('removing: ',remove)
                delete currBlocks[remove]
                console.log('aft',currBlocks)
              updateAllBlocks(currBlocks)
              }
          
          // }
          

          console.log('------------------------------')
          console.log('------------------------------')
      }


  }


  useFrame(()=>{
    let currentBlocks = getAllBlocks()
    let blockkeys  = Object.keys(currentBlocks)
    if(cubeCount.current != blockkeys.length ){
      // console.log('well?')
      cubeCount.current = blockkeys.length
      addToAC(currentBlocks)
    }
  })


  useEffect(()=>{
    if(!addedblocks.current){
      let currBlocks = getAllBlocks()
      console.log('currblocks',currBlocks)
      // var names = Object.keys(stateBlocks[0])
      var names = Object.keys(currBlocks)
      // console.log(names)
      if(names.length <= 1 ){
        let start = {};
        let xs = 1;
        let ys = 1;
        let zs = 1;
        let t = 0.5;
        let key = "";
        
        //makeing suedo cubes for testing
        for (let x = 0; x < xs; x++) {
          for (let y = 0; y < ys; y++) {
            for (let z = 0; z < zs; z++) {
              key = makeKey(x, y, z)
              start[key] = {
                'pos': [x, y, z],
                'texture':'grass'
              }
            }
          }
        }
        console.log('start',start)
        updateAllBlocks(start)
      }
      
      addedblocks.current= true
    } 
  },[])

  return (
    AC.map((inst, ind, full) => {
      if(ind != full.length-1){
        return (<NadaSpace key={'therealmeshboy'+ind} />)
      }
      return (
        <DiffMiddleMan info={inst}  key={'therealmeshboy'+ind} clickCubeFace={clickCubeFace} />
      );
    })
  );
};
