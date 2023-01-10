import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as textures from "../../images/textures";
import { useStore } from "../../hooks/useStore";
import * as THREE from "three";
import { DrawCubesGeo } from "./DrawCubesGeo";

export const FormCubeArrays = ({ activeTextureREF }) => {
  const [getAllBlocks, updateAllBlocks] = useStore((state) => [state.getAllBlocks, state.updateAllBlocks]);
  const [dataCont, setDataCont] = useState([]);
  const { camera, scene } = useThree();
  const addedblocks = useRef(false);
  const cubeCount = useRef(0);
  const cubeFaceIndexesREF = useRef({});

  function makeFaceIndexMapObject(cen, nx, ny, nz) {
    return {
      remove: cen,
      add: {
        key: makeKey(nx, ny, nz),
        pos: [nx, ny, nz],
      },
    };
  }

  function genFaceArrays(t, allkeys, blocks) {
    let t2 = 2 * t;
    let vertices = [];
    let uvs = [];
    let normals = [];

    let uvSize = 1 / 2 / 2 / 2 / 2;
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
      let currtexture = blocks[cen].texture;
      let uvL = (textures["AMTmap"][currtexture][0] - 1) * uvSize;
      let uvB = (textures["AMTmap"][currtexture][1] - 1) * uvSize;

      let onefaceuv = [
        //uv means UxV meaning (u,v) meaning u is the x cordinate v is the y
        uvL + uvSize,
        uvB + 0,
        uvL + uvSize,
        uvB + uvSize,
        uvL + 0,
        uvB + 0,
        uvL + 0,
        uvB + 0,
        uvL + uvSize,
        uvB + uvSize,
        uvL + 0,
        uvB + uvSize,
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
    return x + "." + y + "." + z;
  }

  function updateDataContainer(blocks) {
    let t = 0.5;
    let allkeys = Object.keys(blocks);
    let [vertices, uvs, normals, faceTextures] = genFaceArrays(t, allkeys, blocks);
    vertices = new Float32Array(vertices);
    uvs = new Float32Array(uvs);
    normals = new Float32Array(normals);

    let newAC = [];

    newAC.push({
      vertices,
      normals,
      uvs,
      allkeys,
    });
    setDataCont(newAC);
  }

  function clickCubeFace(e) {
    // e.preventDefault()
    e.stopPropagation(); //click cannot be passed through cube face
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let intersect = raycaster.intersectObjects(scene.children);

    intersect = intersect.filter((inter) => {
      return inter.object.name == "cubesMesh2";
    });

    if (intersect.length > 0) {
      let currBlocks = getAllBlocks();

      let f_Index = intersect[0].faceIndex;
      f_Index = f_Index - (f_Index % 2);

      let currTexture = activeTextureREF.current;

      if (e.which === 1) {
        let newblock = cubeFaceIndexesREF.current[f_Index].add;
        currBlocks[newblock.key] = { pos: newblock.pos, texture: currTexture };
        updateAllBlocks(currBlocks);
      }

      if (e.which === 3) {
        let remove = cubeFaceIndexesREF.current[f_Index].remove;
        delete currBlocks[remove];
        updateAllBlocks(currBlocks);
      }
    }
  }

  useFrame(() => {
    let currentBlocks = getAllBlocks();
    let blockkeys = Object.keys(currentBlocks);
    if (cubeCount.current != blockkeys.length) {
      cubeCount.current = blockkeys.length;
      updateDataContainer(currentBlocks);
    }
  });

  //add bulk cubes for testing
  useEffect(() => {
    //this useeffect is for setup a bulk of cubes to test rendor
    //only happens once
    // can be ignored by settings addedblocks to true at the top
    if (!addedblocks.current) {
        let start = {};
        let xs = 10;
        let ys = 1;
        let zs = 10;
        let t = 0.5;
        let key = "";

        for (let x = 0; x < xs; x++) {
          for (let y = 0; y < ys; y++) {
            for (let z = 0; z < zs; z++) {
              key = makeKey(x, y, z);
              start[key] = {
                pos: [x, y, z],
                texture: "grass",
              };
            }
          }
        }

        updateAllBlocks(start);

      addedblocks.current = true;
    }
  }, []);

  return dataCont.map((inst, ind, full) => {
    return <DrawCubesGeo info={inst} key={`ACmesh${cubeCount.current}-` + ind} clickCubeFace={clickCubeFace} />;
  });
};
