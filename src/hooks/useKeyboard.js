import { useEffect, useRef } from "react";
import { useStore } from "./useStore";

const keyActionMap = {
  KeyW: "moveForward",
  KeyS: "moveBackward",
  KeyA: "moveLeft",
  KeyD: "moveRight",
  KeyQ: "moveQuick",
  ShiftLeft: "moveDown",
  ShiftRight: "moveDown",
  Space: "jump",
  Digit1: "dirt",
  Digit2: "grass",
  Digit3: "glass",
  Digit4: "wood",
  Digit5: "log",
};

function actionByKey(key) {
  return keyActionMap[key];
}

export const useKeyboard = () => {
  const actions = useRef({
    moveForward: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    moveBackward: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    moveLeft: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    moveRight: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    moveQuick: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    moveDown: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    jump: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    dirt: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    grass: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    glass: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    wood: {
      on: false,
      count: 0,
      lastPress: 0,
    },
    log: {
      on: false,
      count: 0,
      lastPress: 0,
    },
  });
  const handleKeyDown = (e) => {
    if (useStore.getState().chatOpen) {
      return; // typing in chat -- don't move the player
    }
    let action = actionByKey(e.code);
    if (action && !actions.current[action].on) {
      let actionObj = actions.current[action];
      actionObj.on = true;
      // double-tap detection for sprint
      let newpress = new Date().getTime();
      if (newpress - actionObj.lastPress > 500) {
        actionObj.count = 0;
      }
      actionObj.count += 1;
      actionObj.lastPress = newpress;
      checkMoveFast(action);
      actions.current[action] = actionObj;
    }
  };

  const handleKeyUp = (e) => {
    const action = actionByKey(e.code);
    if (action) {
      actions.current[action].on = false;
      // sprint ends when no direction key is held any more (moveQuick is
      // the sprint flag itself -- it must not block its own clearing)
      const directionKeys = [
        "moveForward",
        "moveBackward",
        "moveLeft",
        "moveRight",
        "moveDown",
      ];
      if (
        ableToSpeedUpList.includes(action) &&
        !directionKeys.some((a) => actions.current[a].on)
      ) {
        actions.current.moveQuick.on = false;
        actions.current.moveQuick.count = 0;
      }
    }
  };

  const ableToSpeedUpList = [
    "moveForward",
    "moveBackward",
    "moveLeft",
    "moveRight",
    "moveQuick",
    "moveDown",
  ];

  function checkMoveFast(action) {
    // only movement keys may touch sprint state -- pressing Space or a
    // hotbar digit used to reset moveQuick and kill sprint mid-jump
    if (!ableToSpeedUpList.includes(action)) {
      return;
    }
    let movefast = false;
    ableToSpeedUpList.forEach((val) => {
      // double-tap (2 presses inside the window) starts sprinting
      if (actions.current[val].count >= 2) {
        movefast = true;
      }
    });
    if (movefast) {
      actions.current.moveQuick.on = true;
    }
  }

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      window.__keys = actions.current;
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return actions.current;
};
