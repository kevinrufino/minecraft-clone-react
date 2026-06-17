import { useState } from "react";
import settings from "../constants";
import JoyStick from "./Joystick";

// Touch control overlay (#51). Left stick moves, right stick looks (double-tap
// either for sprint / re-center, as before). Adds the two things mobile was
// missing: a Jump button, and a Place/Break toggle so taps can break blocks
// (a tap was always a "place" before). The hotbar slots are tappable too (see
// TextureSelector). The container is pointer-events:none so taps between the
// controls still reach the world to place/break blocks.
const LowerControlStrip = ({ moveBools }) => {
  const joysize = 50;
  const [breakMode, setBreakMode] = useState(settings.breakMode);

  function setJump(on) {
    moveBools.current.jump = on;
  }
  function toggleBreak(e) {
    e.preventDefault();
    settings.breakMode = !settings.breakMode;
    setBreakMode(settings.breakMode);
  }

  return (
    <div id="LowerControlStrip">
      <JoyStick
        myId={"MoveJoy"}
        startx={joysize}
        starty={joysize}
        radius={(joysize * 2) / 3}
        moveBools={moveBools}
        physicalmovement={true}
        overallpos={"left"}
        givenWidth={joysize}
        givenHeight={joysize}
      />

      <div className="touch-actions">
        <button
          className={`touch-btn touch-btn--mode ${breakMode ? "touch-btn--break" : "touch-btn--place"}`}
          onPointerDown={toggleBreak}
        >
          {breakMode ? "Break" : "Place"}
        </button>
        <button
          className="touch-btn touch-btn--jump"
          onPointerDown={(e) => {
            e.preventDefault();
            setJump(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            setJump(false);
          }}
          onPointerLeave={() => setJump(false)}
          onPointerCancel={() => setJump(false)}
        >
          Jump
        </button>
      </div>

      <JoyStick
        myId={"SightJoy"}
        startx={joysize}
        starty={joysize}
        radius={(joysize * 2) / 3}
        moveBools={moveBools}
        sightmovement={true}
        overallpos={"right"}
        givenWidth={joysize}
        givenHeight={joysize}
      />
    </div>
  );
};

export default LowerControlStrip;
