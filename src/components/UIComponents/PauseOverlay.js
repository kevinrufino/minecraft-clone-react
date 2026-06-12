import { useEffect, useState } from "react";
import settings from "../../constants";

const CONTROLS = [
  ["WASD", "Move"],
  ["Space", "Jump"],
  ["Double-tap W", "Sprint"],
  ["Left click", "Place block"],
  ["Right click", "Break block"],
  ["1-5 / Wheel", "Select block"],
  ["Esc", "Pause"],
];

function requestLock() {
  const canvas = document.querySelector("canvas");
  if (canvas) canvas.requestPointerLock();
}

const PauseOverlay = () => {
  const [locked, setLocked] = useState(false);
  const [hasBeenLocked, setHasBeenLocked] = useState(false);

  useEffect(() => {
    function onLockChange() {
      const isLocked = !!document.pointerLockElement;
      setLocked(isLocked);
      if (isLocked) setHasBeenLocked(true);
    }

    document.addEventListener("pointerlockchange", onLockChange);
    return () => document.removeEventListener("pointerlockchange", onLockChange);
  }, []);

  // Don't render anything on touch/joystick devices
  if (settings.movewithJOY_BOOL) return null;

  // Pointer is locked — game is running, no overlay needed
  if (locked) return null;

  const isPaused = hasBeenLocked;

  return (
    <div
      className="pause-overlay"
      onClick={requestLock}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") requestLock();
      }}
    >
      <div className="pause-overlay__panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="pause-overlay__title">
          {isPaused ? "Game Paused" : "Click to play"}
        </h2>

        {!isPaused && (
          <table className="pause-overlay__controls">
            <tbody>
              {CONTROLS.map(([key, action]) => (
                <tr key={key}>
                  <td className="pause-overlay__key">{key}</td>
                  <td className="pause-overlay__action">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {isPaused && (
          <div className="pause-overlay__btn-row">
            <button
              className="mc-play-btn"
              onClick={requestLock}
            >
              Back to Game
            </button>
            <button
              className="mc-play-btn mc-play-btn--danger"
              onClick={() => window.location.reload()}
            >
              Quit to Title
            </button>
          </div>
        )}

        {!isPaused && (
          <button className="mc-play-btn pause-overlay__click-btn" onClick={requestLock}>
            Click to Start
          </button>
        )}
      </div>
    </div>
  );
};

export default PauseOverlay;
