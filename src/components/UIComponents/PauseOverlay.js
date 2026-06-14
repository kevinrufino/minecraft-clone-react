import { useEffect, useState } from "react";
import settings from "../../constants";
import { saveNow } from "../../world/edits";

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
  const [saveMsg, setSaveMsg] = useState("");

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

  function quitToTitle(e) {
    e.stopPropagation();
    e.preventDefault();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    window.location.reload();
  }

  function saveWorld(e) {
    e.stopPropagation();
    e.preventDefault();
    const n = saveNow();
    setSaveMsg(n >= 0 ? `World saved (${n} changes)` : "Nothing to save yet");
  }

  return (
    <div
      className="pause-overlay"
      // click-anywhere only on the first "Click to play" screen; when paused
      // a stray click must not re-lock and swallow the Quit button press
      onClick={isPaused ? undefined : requestLock}
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
          <>
            <div className="pause-overlay__btn-row">
              <button
                className="mc-play-btn"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  requestLock();
                }}
              >
                Back to Game
              </button>
              {!settings.onlineEnabled && (
                <button className="mc-play-btn" onPointerDown={saveWorld}>
                  Save World
                </button>
              )}
              <button
                className="mc-play-btn mc-play-btn--danger"
                onPointerDown={quitToTitle}
              >
                Quit to Title
              </button>
            </div>
            <p className="pause-overlay__note">
              {settings.onlineEnabled
                ? "Multiplayer: anyone who opens this game (another tab or device) joins the same world automatically. Hold Tab to see who's online."
                : saveMsg ||
                  "Your world auto-saves to this browser as you build. Use Save World to save right now."}
            </p>
          </>
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
