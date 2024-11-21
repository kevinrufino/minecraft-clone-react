import { useEffect, useRef } from "react";

function actionByKey(key) {
  const keyActionMap = {
    KeyW: "moveForward",
    KeyS: "moveBackward",
    KeyA: "moveLeft",
    KeyD: "moveRight",
    KeyQ: "moveQuick",
    keyShift: "moveDown",
    Space: "jump",
    Digit1: "dirt",
    Digit2: "grass",
    Digit3: "glass",
    Digit4: "wood",
    Digit5: "log",
  };
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
    let action = actionByKey(e.code);
    if (action && !actions.current[action].on) {
      let actionObj = actions.current[action];
      actionObj.on = true;
      // repeat checker
      console.log("Repeate Checker down");
      let newpress = new Date().getTime();
      console.log({
        diff: newpress - actionObj.lastPress,
        count: actionObj.count,
      });
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
    }
  };

  function checkMoveFast(action) {
    let ableToSpeedUpList = [
      "moveForward",
      "moveBackward",
      "moveLeft",
      "moveRight",
      "moveQuick",
      "moveDown",
      // "jump"
    ];
    let movefast = false;
    if (ableToSpeedUpList.includes(action)) {
      ableToSpeedUpList.forEach((val) => {
        if (actions.current[val].count >= 3) {
          console.log("MOVING FASTER-----------------------------");
          movefast = true;
        }
      });
    }
    actions.current.moveQuick.on = movefast;
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return actions.current;
};
