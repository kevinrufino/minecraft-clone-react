import { useSphere } from "@react-three/cannon";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3, Euler } from "three";
import settings from "../../constants";
import { useKeyboard } from "../../hooks/useKeyboard";
import { useStore } from "../../hooks/useStore";
import { FPV } from "./controls/FPV";

const JUMP_HIEGHT = 10;
const JUMP_VEL = 10;
const SPEED = 4;
const QUICKFACTOR = 2;
const t = 0.5; //thickness -- should be in a better universal place
const MAXfallspeed = -10;
const playerStandingHeight = 1.5;

export const Player = ({ myradius = 0.5, moveBools, playerStartingPostion, REF_ALLCUBES }) => {
  const setStartingRotationOnce = useRef(true);
  const { camera, scene } = useThree();
  const { moveBackward, moveForward, moveLeft, moveRight, moveDown, jump, moveQuick } = useKeyboard();
  const [ref, api] = useSphere(() => ({
    mass: 0,
    type: "Dynamic",
    position: playerStartingPostion,
    rotation: settings.startingRotationDefault,
    args: [myradius],
  }));
  const acc = useRef([0, -1, 0]); // default gravity
  const vel = useRef([0, 0, 0]); // current velocity
  const pos = useRef(playerStartingPostion);
  const rot = useRef([0, (180 * Math.PI) / 180, 0, "YXZ"]);
  const [socket, online_sendPos] = useStore((state) => [state.socket, state.online_sendPos]);
  const movementStatus = useRef({
    flying: false,
    running: false,
    falling: false,
    jumping: false,
    inWater: false,
    onGround: false,
  });

  const blocktypes = {
    floor: {
      solid: [], // default to solid
      liquid: ["water"],
      air: [],
    },
  };

  function doMovement() {
    const direction = new Vector3();
    const frontVector = new Vector3(0, 0, (moveBackward.on ? 1 : 0) - (moveForward.on ? 1 : 0));
    const sideVector = new Vector3((moveLeft.on ? 1 : 0) - (moveRight.on ? 1 : 0), 0, 0);
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(moveQuick.on ? SPEED * QUICKFACTOR : SPEED)
      .applyEuler(camera.rotation);
    direction.y = vel.current[1]; // this line maintains gravity

    //stop player from moving into the negatives -- outside world boundries
    let surrdata = checkTerrain([direction.x, direction.y, direction.z]);
    let bottomblock = REF_ALLCUBES.current[surrdata.surroundingBlocks.b];
    api.velocity.set(...worldPhysicsController(direction, surrdata));

    // jump
    if (jump.on && movementStatus.current.onGround) {
      vel.current[1] = JUMP_VEL;
      movementStatus.current.onGround = false;
      api.velocity.set(vel.current[0], vel.current[1], vel.current[2]);
    }

    // camera follows "player"
    if (!settings.ignoreCameraFollowPlayer) {
      camera.position.copy(new Vector3(pos.current[0], pos.current[1], pos.current[2]));
    }
  }

  function doMovementWithJoy() {
    const direction = new Vector3();
    const frontVector = new Vector3(
      0,
      0,
      (moveBools.current.moveBackward ? 1 : 0) - (moveBools.current.moveForward ? 1 : 0)
    );
    const sideVector = new Vector3((moveBools.current.moveLeft ? 1 : 0) - (moveBools.current.moveRight ? 1 : 0), 0, 0);
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED * (moveBools.current.moveQuick * QUICKFACTOR + 1))
      .applyEuler(new Euler(...rot.current));

    //stop player from moving into the negatives
    api.velocity.set(...checkAbsoluteMapLimits(direction));

    // jump
    if (jump && Math.abs(vel.current[1]) < 0.05) {
      api.velocity.set(vel.current[0], vel.current[1] + JUMP_HIEGHT, vel.current[2]);
    }

    // camera follows "player"
    if (!settings.ignoreCameraFollowPlayer) {
      camera.position.copy(new Vector3(pos.current[0], pos.current[1], pos.current[2]));
    }

    doSightWithJoy();
  }

  function checkAbsoluteMapLimits(direction) {
    // let [x,y,z] = [direction.x,direction.y,direction.z]
    let [x, y, z] = direction;
    let worldSideLen = settings.worldSettings.chunkSize * settings.worldSettings.worldSize;

    if (pos.current[0] <= 0.1) {
      x = 1;
    }
    if (pos.current[0] >= worldSideLen - 0.9) {
      x = -1;
    }
    if (pos.current[1] <= 0.1) {
      y = 1;
    }
    // if(pos.current[1]>=255.1){
    //     y=-1
    // }
    if (pos.current[2] <= 0.1) {
      z = 1;
    }
    if (pos.current[2] >= worldSideLen - 0.9) {
      z = -1;
    }

    // return worldPhysicsController([x,y,z])
    return [x, y, z];
  }

  function worldPhysicsController(direction, surrdata) {
    let [vel_x, vel_y, vel_z] = [direction.x, direction.y, direction.z];
    // they take directional speed, then divide by 60 (probs from frames), and then add it to the position for smooth motion

    if (!movementStatus.current.flying) {
      //check vertical limits
      if (!surrdata.surroundingBlocks.b) {
        movementStatus.current.onGround = false;
      }

      if (!movementStatus.current.onGround) {
        vel_y += acc.current[1];
        vel_y = vel_y <= MAXfallspeed ? MAXfallspeed : vel_y;

        //check bottom
        if (surrdata.surroundingBlocks.b) {
          let bottomblock = REF_ALLCUBES.current[surrdata.surroundingBlocks.b];

          if (!blocktypes.floor.air.includes(bottomblock.texture)) {
            let newy = (camera.position.y + vel_y / 60).toFixed(5);
            let found = bottomblock.pos[1] + t;
            if (newy - playerStandingHeight < found) {
              vel_y = 0;
              movementStatus.current.onGround = true;

              pos.current[1] = bottomblock.pos[1] + t + playerStandingHeight;
              api.position.set(...pos.current);
            }
          }
        }
        //check top
        if (surrdata.surroundingBlocks.t) {
          console.log({ t: surrdata.surroundingBlocks.t });

          let topblock = REF_ALLCUBES.current[surrdata.surroundingBlocks.t];
          if (!blocktypes.floor.air.includes(topblock.texture)) {
            let newy = (camera.position.y + vel_y / 60).toFixed(5);
            let found = topblock.pos[1] - t - 0.3;
            if (newy > found) {
              vel_y = 0;
              pos.current[1] = topblock.pos[1] - t - 0.3;
              api.position.set(...pos.current);
            }
          }
        }
      } else {
        vel_y = 0;
      }

      let sides = [
        { s: "lb", cord: "z", cordnum: 2, dir: 1 },
        { s: "lt", cord: "z", cordnum: 2, dir: 1 },
        { s: "rt", cord: "z", cordnum: 2, dir: -1 },
        { s: "rb", cord: "z", cordnum: 2, dir: -1 },
        { s: "ft", cord: "x", cordnum: 0, dir: -1 },
        { s: "fb", cord: "x", cordnum: 0, dir: -1 },
        { s: "bt", cord: "x", cordnum: 0, dir: 1 },
        { s: "bb", cord: "x", cordnum: 0, dir: 1 },
      ];
      let diags = [
        { s: "lfb", dirx: -1, dirz: 1 },
        { s: "lft", dirx: -1, dirz: 1 },
        { s: "rfb", dirx: -1, dirz: -1 },
        { s: "rft", dirx: -1, dirz: -1 },
        { s: "lbt", dirx: 1, dirz: 1 },
        { s: "lbb", dirx: 1, dirz: 1 },
        { s: "rbt", dirx: 1, dirz: -1 },
        { s: "rbb", dirx: 1, dirz: -1 },
      ];
      let vel = [vel_x, vel_y, vel_z];
      if (isPlayerGivingInput()) {
        sides.forEach((side, ind) => {
          if (surrdata.surroundingBlocks[side.s]) {
            let sideblock = REF_ALLCUBES.current[surrdata.surroundingBlocks[side.s]];
            if (!blocktypes.floor.air.includes(sideblock.texture)) {
              let newcord = (camera.position[side.cord] + vel[side.cordnum] / 60).toFixed(5);
              let foundlimit = sideblock.pos[side.cordnum] + (t + 0.3) * side.dir;
              if ((newcord - foundlimit) * -1 * side.dir > 0 && vel[side.cordnum] * -1 * side.dir > 0) {
                vel[side.cordnum] = 0;
              }
            }
          }
        });

        diags.forEach((side, ind) => {
          let virtaulboxgap = 0.1;
          let vbg = virtaulboxgap;

          if (surrdata.surroundingBlocks[side.s]) {
            let sideblock = REF_ALLCUBES.current[surrdata.surroundingBlocks[side.s]];
            if (!blocktypes.floor.air.includes(sideblock.texture)) {
              let newcordx = (camera.position["x"] + vel[0] / 60).toFixed(5);
              let newcordz = (camera.position["z"] + vel[2] / 60).toFixed(5);
              let foundlimitx = sideblock.pos[0] + (t + vbg) * side.dirx;
              let foundlimitz = sideblock.pos[2] + (t + vbg) * side.dirz;

              if (
                (newcordx - foundlimitx) * -1 * side.dirx > 0 &&
                vel[0] * -1 * side.dirx > 0 &&
                (newcordz - foundlimitz) * -1 * side.dirz > 0
              ) {
                vel[0] = 0;
              }
              if (
                (newcordz - foundlimitz) * -1 * side.dirz > 0 &&
                vel[2] * -1 * side.dirz > 0 &&
                (newcordx - foundlimitx) * -1 * side.dirx > 0
              ) {
                vel[2] = 0;
              }
            }
          }
        });
      }

      vel_x = vel[0];
      vel_y = vel[1];
      vel_z = vel[2];
    } else {
      console.log("YOUR FLYING!!!!! WOW");
    }

    return checkAbsoluteMapLimits([vel_x, vel_y, vel_z]);
  }

  function checkTerrain() {
    let nearestblockspot = [...camera.position].map((val) => Math.round(val));
    let nbs = nearestblockspot;
    let topPlayerBlock = [...camera.position];
    let tpb = topPlayerBlock;
    let bottomPlayerBlock = [tpb[0], tpb[1] - 1, tpb[2]];
    let bpb = bottomPlayerBlock;
    let surroundingBlocks = {};

    surroundingBlocks.nbs = nbs;
    //sides
    surroundingBlocks.t = blockExists(makeKey(nbs[0], nbs[1] + 1, nbs[2]));
    surroundingBlocks.b = blockExists(makeKey(nbs[0], nbs[1] - 2, nbs[2]));
    surroundingBlocks.ft = blockExists(makeKey(nbs[0] + 1, nbs[1], nbs[2]));
    surroundingBlocks.bt = blockExists(makeKey(nbs[0] - 1, nbs[1], nbs[2]));
    surroundingBlocks.rt = blockExists(makeKey(nbs[0], nbs[1], nbs[2] + 1));
    surroundingBlocks.lt = blockExists(makeKey(nbs[0], nbs[1], nbs[2] - 1));
    surroundingBlocks.fb = blockExists(makeKey(nbs[0] + 1, nbs[1] - 1, nbs[2]));
    surroundingBlocks.bb = blockExists(makeKey(nbs[0] - 1, nbs[1] - 1, nbs[2]));
    surroundingBlocks.rb = blockExists(makeKey(nbs[0], nbs[1] - 1, nbs[2] + 1));
    surroundingBlocks.lb = blockExists(makeKey(nbs[0], nbs[1] - 1, nbs[2] - 1));

    //diags
    surroundingBlocks.lfb = blockExists(makeKey(nbs[0] + 1, nbs[1] - 1, nbs[2] - 1));
    surroundingBlocks.lft = blockExists(makeKey(nbs[0] + 1, nbs[1], nbs[2] - 1));
    surroundingBlocks.rfb = blockExists(makeKey(nbs[0] + 1, nbs[1] - 1, nbs[2] + 1));
    surroundingBlocks.rft = blockExists(makeKey(nbs[0] + 1, nbs[1], nbs[2] + 1));
    surroundingBlocks.lbb = blockExists(makeKey(nbs[0] - 1, nbs[1] - 1, nbs[2] - 1));
    surroundingBlocks.lbt = blockExists(makeKey(nbs[0] - 1, nbs[1], nbs[2] - 1));
    surroundingBlocks.rbb = blockExists(makeKey(nbs[0] - 1, nbs[1] - 1, nbs[2] + 1));
    surroundingBlocks.rbt = blockExists(makeKey(nbs[0] - 1, nbs[1], nbs[2] + 1));

    return { tpb, bpb, surroundingBlocks };
  }

  function blockExists(block) {
    return block in REF_ALLCUBES.current ? block : "";
  }

  function makeKey(x, y, z) {
    return x + "." + y + "." + z;
  }

  function isPlayerGivingInput() {
    if (moveForward.on || moveBackward.on || moveLeft.on || moveRight.on || moveQuick.on || moveDown.on || jump.on) {
      return true;
    }
    return false;
  }

  // meant to help give the server a players location so other players can see where said player is
  function doOnlinePlayerPos() {
    if (settings.onlineEnabled) {
      if (socket.connected) {
        online_sendPos(pos.current);
      }
    }
  }

  //currently this is broken
  function doSightWithJoy() {
    if (!settings.ignoreCameraFollowPlayer) {
      camera.position.copy(new Vector3(pos.current[0], pos.current[1], pos.current[2]));
    }

    if (!settings.ignoreCameraFollowPlayer) {
      if (moveBools.current.camLeft || moveBools.current.camRight) {
      }

      let hor = moveBools.current.camLeft ? 1 : moveBools.current.camRight ? -1 : 0;
      let ver = moveBools.current.camUp ? 1 : moveBools.current.camDown ? -1 : 0;
      if (moveBools.current.camCenterTC > 2) {
        moveBools.current.camCenterTC = 0;
        rot.current = [...settings.startingRotationDefault, "YXZ"];
      }
      if (hor || ver || true) {
        rot.current = [
          (rot.current[0] += 0.01 * ver),
          (rot.current[1] += 0.01 * hor),
          rot.current[2],
          "YXZ",
          // THE ODER SHOULD ALLWAYS BE YAW-PITCH-ROLL
        ];
        rot.current.forEach((val, index) => {
          if (index < 3) {
            if (val > 2 * Math.PI) {
              rot.current[index] -= 2 * Math.PI;
            }
            if (val < -2 * Math.PI) {
              rot.current[index] += 2 * Math.PI;
            }
          }
        });
      }
      camera.rotation.set(...rot.current);
    }
  }

  useEffect(() => {
    api.velocity.subscribe((v) => (vel.current = v));
  }, [api.velocity]);

  useEffect(() => {
    api.position.subscribe((p) => {
      pos.current = p;
    });
  }, [api.position]);

  useFrame(() => {
    if (setStartingRotationOnce.current) {
      setStartingRotationOnce.current = false;
      camera.rotation.copy(new Euler(...[...settings.startingRotationDefault, "YXZ"]));
    }
    // doOnlinePlayerPos()
    settings.movewithJOY_BOOL ? doMovementWithJoy() : doMovement();
  });

  return (
    <>
      {/* THIS IS WHERE THE PLAYER BODY 3JS should go */}
      <mesh ref={ref}>
        {/* <boxGeometry attach="geometry" args={[5,5,5]}/> */}
        <sphereGeometry attach="geometry" args={[myradius]} />
        <meshStandardMaterial attach="material" color="orange" />
      </mesh>
      {settings.movewithJOY_BOOL ? <></> : <FPV />}
    </>
  );
};
