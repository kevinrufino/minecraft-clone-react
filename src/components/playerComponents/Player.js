import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3, Euler } from "three";
import settings from "../../constants";
import { useKeyboard } from "../../hooks/useKeyboard";
import { useStore } from "../../hooks/useStore";
import { makeKey } from "../../world/keys";
import { FPV } from "./controls/FPV";

const JUMP_VEL = 10;
const SPEED = 4;
const QUICKFACTOR = 2;
const GRAVITY = -60; // units/s^2
const MAXfallspeed = -10;
const t = 0.5; //block half-thickness
const playerStandingHeight = 1.5;
const MAX_DT = 0.1; // clamp big frame gaps (tab switches) so physics can't tunnel

export const Player = ({ moveBools, playerStartingPostion, REF_ALLCUBES }) => {
  const initializedOnce = useRef(false);
  const { camera } = useThree();
  const {
    moveBackward,
    moveForward,
    moveLeft,
    moveRight,
    moveDown,
    jump,
    moveQuick,
  } = useKeyboard();

  const vel = useRef([0, 0, 0]); // current velocity
  const pos = useRef([...playerStartingPostion]); // current position
  const rot = useRef([0, Math.PI, 0, "YXZ"]);
  const [socket, online_sendPos] = useStore((state) => [
    state.socket,
    state.online_sendPos,
  ]);
  const movementStatus = useRef({
    flying: false,
    onGround: false,
  });

  const blocktypes = {
    floor: {
      solid: [], // default to solid
      liquid: ["water"],
      air: ["water"], // non-solid for collision purposes
    },
  };

  function doMovement(dt) {
    const direction = new Vector3();
    const frontVector = new Vector3(
      0,
      0,
      (moveBackward.on ? 1 : 0) - (moveForward.on ? 1 : 0),
    );

    const sideVector = new Vector3(
      (moveLeft.on ? 1 : 0) - (moveRight.on ? 1 : 0),
      0,
      0,
    );

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(moveQuick.on ? SPEED * QUICKFACTOR : SPEED)
      .applyEuler(camera.rotation);

    direction.y = vel.current[1]; // this line maintains gravity

    const surrData = checkTerrain();
    vel.current = worldPhysicsController(direction, surrData, dt);

    if (jump.on && movementStatus.current.onGround) {
      vel.current[1] = JUMP_VEL;
      movementStatus.current.onGround = false;
    }
  }

  function doMovementWithJoy(dt) {
    const direction = new Vector3();
    const frontVector = new Vector3(
      0,
      0,
      (moveBools.current.moveBackward ? 1 : 0) -
        (moveBools.current.moveForward ? 1 : 0),
    );
    const sideVector = new Vector3(
      (moveBools.current.moveLeft ? 1 : 0) -
        (moveBools.current.moveRight ? 1 : 0),
      0,
      0,
    );
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED * (moveBools.current.moveQuick * QUICKFACTOR + 1))
      .applyEuler(new Euler(...rot.current));

    direction.y = vel.current[1];

    const surrData = checkTerrain();
    vel.current = worldPhysicsController(direction, surrData, dt);

    if (moveBools.current.jump && movementStatus.current.onGround) {
      vel.current[1] = JUMP_VEL;
      movementStatus.current.onGround = false;
    }

    doSightWithJoy();
  }

  function isInWater() {
    const [x, y, z] = pos.current.map(Math.round);
    const feet = REF_ALLCUBES.current[makeKey(x, y - 1, z)];
    const eyes = REF_ALLCUBES.current[makeKey(x, y, z)];
    return feet?.texture === "water" || eyes?.texture === "water";
  }

  function worldPhysicsController(direction, surrData, dt) {
    let [vel_x, vel_y, vel_z] = [direction.x, direction.y, direction.z];
    const inWater = isInWater();
    movementStatus.current.inWater = inWater;

    if (!movementStatus.current.flying) {
      //check vertical limits
      if (!surrData.surroundingBlocks.b) {
        movementStatus.current.onGround = false;
      }

      if (!movementStatus.current.onGround) {
        vel_y += GRAVITY * dt;
        // water: sink slowly, swim up with jump
        if (inWater) {
          const maxSink = -2;
          vel_y = vel_y < maxSink ? maxSink : vel_y;
          if (jump.on || moveBools.current.jump) {
            vel_y = 3;
          }
        }
        vel_y = vel_y <= MAXfallspeed ? MAXfallspeed : vel_y;

        //check bottom
        if (surrData.surroundingBlocks.b) {
          let bottomblock = REF_ALLCUBES.current[surrData.surroundingBlocks.b];

          if (!blocktypes.floor.air.includes(bottomblock.texture)) {
            let newy = pos.current[1] + vel_y * dt;
            let found = bottomblock.pos[1] + t;
            if (newy - playerStandingHeight < found) {
              vel_y = 0;
              movementStatus.current.onGround = true;
              pos.current[1] = bottomblock.pos[1] + t + playerStandingHeight;
            }
          }
        }
        //check top
        if (surrData.surroundingBlocks.t) {
          let topblock = REF_ALLCUBES.current[surrData.surroundingBlocks.t];
          if (!blocktypes.floor.air.includes(topblock.texture)) {
            let newy = pos.current[1] + vel_y * dt;
            let found = topblock.pos[1] - t - 0.3;
            if (newy > found) {
              vel_y = 0;
              pos.current[1] = topblock.pos[1] - t - 0.3;
            }
          }
        }
      } else {
        vel_y = 0;
      }

      let sides = [
        { s: "lb", cordnum: 2, dir: 1 },
        { s: "lt", cordnum: 2, dir: 1 },
        { s: "rt", cordnum: 2, dir: -1 },
        { s: "rb", cordnum: 2, dir: -1 },
        { s: "ft", cordnum: 0, dir: -1 },
        { s: "fb", cordnum: 0, dir: -1 },
        { s: "bt", cordnum: 0, dir: 1 },
        { s: "bb", cordnum: 0, dir: 1 },
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
      let velArr = [vel_x, vel_y, vel_z];
      if (isPlayerGivingInput()) {
        sides.forEach((side) => {
          if (surrData.surroundingBlocks[side.s]) {
            let sideblock =
              REF_ALLCUBES.current[surrData.surroundingBlocks[side.s]];
            if (!blocktypes.floor.air.includes(sideblock.texture)) {
              let newcord =
                pos.current[side.cordnum] + velArr[side.cordnum] * dt;
              let foundlimit =
                sideblock.pos[side.cordnum] + (t + 0.3) * side.dir;
              if (
                (newcord - foundlimit) * -1 * side.dir > 0 &&
                velArr[side.cordnum] * -1 * side.dir > 0
              ) {
                velArr[side.cordnum] = 0;
              }
            }
          }
        });

        diags.forEach((side) => {
          let virtaulboxgap = 0.1;
          let vbg = virtaulboxgap;

          if (surrData.surroundingBlocks[side.s]) {
            let sideblock =
              REF_ALLCUBES.current[surrData.surroundingBlocks[side.s]];
            if (!blocktypes.floor.air.includes(sideblock.texture)) {
              let newcordx = pos.current[0] + velArr[0] * dt;
              let newcordz = pos.current[2] + velArr[2] * dt;
              let foundlimitx = sideblock.pos[0] + (t + vbg) * side.dirx;
              let foundlimitz = sideblock.pos[2] + (t + vbg) * side.dirz;

              if (
                (newcordx - foundlimitx) * -1 * side.dirx > 0 &&
                velArr[0] * -1 * side.dirx > 0 &&
                (newcordz - foundlimitz) * -1 * side.dirz > 0
              ) {
                velArr[0] = 0;
              }
              if (
                (newcordz - foundlimitz) * -1 * side.dirz > 0 &&
                velArr[2] * -1 * side.dirz > 0 &&
                (newcordx - foundlimitx) * -1 * side.dirx > 0
              ) {
                velArr[2] = 0;
              }
            }
          }
        });
      }

      vel_x = velArr[0];
      vel_y = velArr[1];
      vel_z = velArr[2];
    }

    return [vel_x, vel_y, vel_z];
  }

  function checkTerrain() {
    let nbs = pos.current.map((val) => Math.round(val));
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
    surroundingBlocks.lfb = blockExists(
      makeKey(nbs[0] + 1, nbs[1] - 1, nbs[2] - 1),
    );
    surroundingBlocks.lft = blockExists(
      makeKey(nbs[0] + 1, nbs[1], nbs[2] - 1),
    );
    surroundingBlocks.rfb = blockExists(
      makeKey(nbs[0] + 1, nbs[1] - 1, nbs[2] + 1),
    );
    surroundingBlocks.rft = blockExists(
      makeKey(nbs[0] + 1, nbs[1], nbs[2] + 1),
    );
    surroundingBlocks.lbb = blockExists(
      makeKey(nbs[0] - 1, nbs[1] - 1, nbs[2] - 1),
    );
    surroundingBlocks.lbt = blockExists(
      makeKey(nbs[0] - 1, nbs[1], nbs[2] - 1),
    );
    surroundingBlocks.rbb = blockExists(
      makeKey(nbs[0] - 1, nbs[1] - 1, nbs[2] + 1),
    );
    surroundingBlocks.rbt = blockExists(
      makeKey(nbs[0] - 1, nbs[1], nbs[2] + 1),
    );

    return { surroundingBlocks };
  }

  function blockExists(block) {
    return block in REF_ALLCUBES.current ? block : "";
  }

  function isPlayerGivingInput() {
    if (settings.movewithJOY_BOOL) {
      return (
        moveBools.current.moveForward ||
        moveBools.current.moveBackward ||
        moveBools.current.moveLeft ||
        moveBools.current.moveRight ||
        moveBools.current.moveQuick ||
        moveBools.current.jump
      );
    }
    return (
      moveForward.on ||
      moveBackward.on ||
      moveLeft.on ||
      moveRight.on ||
      moveQuick.on ||
      moveDown.on ||
      jump.on
    );
  }

  // give the server this players location so other players can see it,
  // throttled so we don't emit on every frame
  const lastPosSend = useRef(0);
  const POS_SEND_INTERVAL_MS = 66; // ~15 updates/sec

  function doOnlinePlayerPos() {
    if (settings.onlineEnabled && socket && socket.connected) {
      const now = performance.now();
      if (now - lastPosSend.current >= POS_SEND_INTERVAL_MS) {
        lastPosSend.current = now;
        online_sendPos(pos.current);
      }
    }
  }

  function doSightWithJoy() {
    if (settings.ignoreCameraFollowPlayer) {
      return;
    }

    let hor = moveBools.current.camLeft
      ? 1
      : moveBools.current.camRight
        ? -1
        : 0;
    let ver = moveBools.current.camUp
      ? 1
      : moveBools.current.camDown
        ? -1
        : 0;
    if (moveBools.current.camCenterTC > 2) {
      moveBools.current.camCenterTC = 0;
      rot.current = [...settings.startingRotationDefault, "YXZ"];
    }
    rot.current = [
      (rot.current[0] += 0.01 * ver),
      (rot.current[1] += 0.01 * hor),
      rot.current[2],
      "YXZ",
      // THE ORDER SHOULD ALWAYS BE YAW-PITCH-ROLL
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
    camera.rotation.set(...rot.current);
  }

  useFrame((state, delta) => {
    const dt = Math.min(delta, MAX_DT);

    if (!initializedOnce.current) {
      initializedOnce.current = true;
      camera.rotation.copy(
        new Euler(...settings.startingRotationDefault, "YXZ"),
      );
    }

    settings.movewithJOY_BOOL ? doMovementWithJoy(dt) : doMovement(dt);

    // integrate position
    pos.current[0] += vel.current[0] * dt;
    pos.current[1] += vel.current[1] * dt;
    pos.current[2] += vel.current[2] * dt;

    // fell out of the world (e.g. into an ungenerated chunk) -- respawn
    if (pos.current[1] < settings.worldSettings.minY - 20) {
      pos.current = [...playerStartingPostion];
      vel.current = [0, 0, 0];
    }

    // camera follows "player"
    if (!settings.ignoreCameraFollowPlayer) {
      camera.position.set(...pos.current);
    }

    doOnlinePlayerPos();

    if (process.env.NODE_ENV === "development") {
      window.__playerPos = [...pos.current];
      window.__camDir = camera.getWorldDirection(new Vector3()).toArray();
      window.__camera = camera;
      window.__teleport = (x, y, z) => {
        pos.current = [x, y, z];
        vel.current = [0, 0, 0];
      };
      window.__blocks = REF_ALLCUBES.current;
    }
  });

  return settings.movewithJOY_BOOL ? <></> : <FPV />;
};
