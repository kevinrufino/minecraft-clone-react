import { useEffect, useRef, useState } from "react";
import { useStore } from "../../hooks/useStore";
import { Chunk } from "./Chunk";
import { TestPlaceHolder } from "./TestPlaceHolder";

// https://www.smashingmagazine.com/2020/10/tasks-react-app-web-workers/

export const Cubes = ({ activeTextureREF,REF_ALLCUBES }) => {
  console.log("-------- rerender Cubes");
  // const [getAllBlocks, updateAllBlocks] = useStore((state) => [state.getAllBlocks, state.updateAllBlocks]);
  // const [updateAllBlocks] = useStore((state) => [state.updateAllBlocks]);
  // const [arr,setArr] = useState (new Array(9).fill(0))
  let worldCubeSize = 3;
  let worldHeight = 1;
  let objtest = { count: 0 };
  const chunks = useRef(new Array(worldCubeSize ** 2).fill());
  const addedblocks = useRef(false);

  function makeKey(x, y, z) {
    return x + "." + y + "." + z;
  }
  //add bulk cubes for testing
  useEffect(() => {
    //this useeffect is for setup a bulk of cubes to test rendor
    //only happens once
    // can be ignored by settings addedblocks to true at the top
    if (!addedblocks.current) {
      let start = {};
      let xs = 9;
      let ys = 1;
      let zs = 9;
      let t = 0.5;
      let yminus = -5000
      let key = "";

      for (let x = 0; x < xs; x++) {
        for (let y = yminus; y < ys; y++) {
          for (let z = 0; z < zs; z++) {
            key = makeKey(x, y, z);
            start[key] = {
              pos: [x, y, z],
              texture: "grass",
            };
          }
        }
      }

      // updateAllBlocks(start);
      REF_ALLCUBES.current = start

      addedblocks.current = true;
    }
  }, []);

  function getChunksStartingCubeCount() {
    let wcs = worldCubeSize;
    let wch = worldHeight;
    // let ab = getAllBlocks();
    let ab = REF_ALLCUBES.current;
    let abkeys = Object.keys(ab);
    let newarr = new Array(wcs ** 2).fill();
    let newkeys = new Array(wcs ** 2).fill();

    abkeys.forEach((cube, index) => {
      let [x, y, z] = ab[cube].pos;
      // console.log( x,y,z)
      // console.log( Math.floor(x/wcs),Math.floor(z/wcs))
      let c = Math.floor(x / wcs) * 3 + Math.floor(z / wcs);
      // console.log(`${x}.${y}.${z} - chunk: ${ c}`)
      if (!newarr[c]) {
        // console.log('nada')
        newarr[c] = { count: 0 };
      }
      if (!newkeys[c]) {
        newkeys[c] = { keys: new Array(wcs ** 2 * wch) };
      }
      // console.log(c)
      // console.log('what',newkeys[c])
      newkeys[c].keys[newarr[c].count] = cube;
      newarr[c].count += 1;
    });
    for (let i = 0; i < newarr.length; i++) {
      if (!newarr[i]) {
        newarr[i] = { count: 0 };
      }
      if (!newkeys[i]) {
        newarr[i]["keys"] = [];
      } else {
        newarr[i]["keys"] = newkeys[i].keys;
      }
    }

    chunks.current = newarr;
    // console.log(chunks.current)

    return chunks.current.map((ele, ind) => {
      // if (ind == 4) {
      //   return <TestPlaceHolder key={`TPH${ind}-${ele}`} />;
      // }
      // console.log('cunk',activeTextureREF)
      return (
        <Chunk
          key={`cubechunk${ind}-${ele}`}
          chunknum={ind}
          myblocks={chunks.current[ind]}
          activeTextureREF={activeTextureREF}
          REF_ALLCUBES={REF_ALLCUBES}
        />
      );
    });

    // return (
    //   <>
    //           <Chunk
    //       chunknum={0}
    //       myblocks={chunks.current[0]}
    //       activeTextureREF={activeTextureREF}
    //       REF_ALLCUBES={REF_ALLCUBES}
    //     />
    //             <Chunk
    //       chunknum={4}
    //       myblocks={chunks.current[4]}
    //       activeTextureREF={activeTextureREF}
    //       REF_ALLCUBES={REF_ALLCUBES}
    //     />
    //     <Chunk
    //       chunknum={8}
    //       myblocks={chunks.current[8]}
    //       activeTextureREF={activeTextureREF}
    //       REF_ALLCUBES={REF_ALLCUBES}
    //     />
    //   </>
    // );
  }

  return getChunksStartingCubeCount();
};
