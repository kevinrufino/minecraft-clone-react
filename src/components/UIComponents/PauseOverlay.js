import { useEffect, useState } from "react";
import settings from "../../constants";
import { persistEditsTo } from "../../world/edits";
import { listSaves, getSave, upsertSave, createSaveId } from "../../world/saves";

const CONTROLS = [
  ["WASD", "Move"],
  ["Space", "Jump"],
  ["Double-tap W", "Sprint"],
  ["Left click", "Place block"],
  ["Right click", "Break block"],
  ["1-9 / Wheel", "Select block"],
  ["M", "Mute sound"],
  ["Esc", "Pause"],
];

function ControlsLegend() {
  return (
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
  );
}

function requestLock() {
  const canvas = document.querySelector("canvas");
  if (canvas) canvas.requestPointerLock();
}

const PauseOverlay = () => {
  const [locked, setLocked] = useState(false);
  const [hasBeenLocked, setHasBeenLocked] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // "Save Game" sub-panel
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [overwriteId, setOverwriteId] = useState(null);
  const [saves, setSaves] = useState([]);

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

  function openSavePanel(e) {
    e.stopPropagation();
    e.preventDefault();
    const current = getSave(settings.currentSaveId);
    setSaveName(current ? current.name : "");
    setOverwriteId(null);
    setSaves(listSaves());
    setSaveMsg("");
    setSaving(true);
  }

  function pickOverwrite(s) {
    if (overwriteId === s.id) {
      setOverwriteId(null);
    } else {
      setOverwriteId(s.id);
      setSaveName(s.name);
    }
  }

  function commitSave(e) {
    e.stopPropagation();
    e.preventDefault();
    const targetId = overwriteId || settings.currentSaveId || createSaveId();
    const name = saveName.trim() || "My World";
    const count = persistEditsTo(targetId);
    upsertSave({ id: targetId, name, seed: settings.worldSettings.seed });
    settings.currentSaveId = targetId;
    setSaving(false);
    setSaveMsg(
      count >= 0
        ? `Saved "${name}" (${count} ${count === 1 ? "change" : "changes"})`
        : "Couldn't save — storage unavailable",
    );
  }

  function cancelSave(e) {
    e.stopPropagation();
    e.preventDefault();
    setSaving(false);
  }

  return (
    <div
      className="pause-overlay"
      // click-anywhere only on the first "Click to play" screen; when paused
      // a stray click must not re-lock and swallow the panel buttons
      onClick={isPaused ? undefined : requestLock}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!isPaused && (e.key === "Enter" || e.key === " ")) requestLock();
      }}
    >
      <div className="pause-overlay__panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="pause-overlay__title">{isPaused ? (saving ? "Save Game" : "Game Paused") : "Click to play"}</h2>

        {/* Save Game sub-panel (paused, offline only) */}
        {isPaused && saving ? (
          <div className="pause-save">
            <div className="mc-field">
              <label className="mc-label" htmlFor="pause-save-name">
                Save Name
              </label>
              <input
                id="pause-save-name"
                className="mc-input"
                type="text"
                value={saveName}
                maxLength={32}
                placeholder="My World"
                onChange={(e) => {
                  setSaveName(e.target.value);
                  setOverwriteId(null);
                }}
              />
            </div>

            {saves.length > 0 && (
              <>
                <p className="pause-save__label">Or overwrite a saved world:</p>
                <ul className="save-list save-list--compact">
                  {saves.map((s) => (
                    <li key={s.id} className="save-row">
                      <button
                        className={`save-row__main${overwriteId === s.id ? " save-row__main--active" : ""}`}
                        onClick={() => pickOverwrite(s)}
                      >
                        <span className="save-row__name">
                          {s.name}
                          {s.id === settings.currentSaveId ? " (current)" : ""}
                        </span>
                        <span className="save-row__meta">seed: {s.seed}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="pause-overlay__btn-row">
              <button className="mc-play-btn" onPointerDown={commitSave}>
                {overwriteId ? "Overwrite Save" : "Save"}
              </button>
              <button className="mc-play-btn" onPointerDown={cancelSave}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <ControlsLegend />
        )}

        {/* Paused action buttons (hidden while the save panel is open) */}
        {isPaused && !saving && (
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
                <button className="mc-play-btn" onPointerDown={openSavePanel}>
                  Save Game
                </button>
              )}
              <button className="mc-play-btn mc-play-btn--danger" onPointerDown={quitToTitle}>
                Quit to Title
              </button>
            </div>
            <p className="pause-overlay__note">
              {settings.onlineEnabled
                ? "Multiplayer: anyone who opens this game (another tab or device) joins the same world. Hold Tab to see who's online."
                : saveMsg || "Your world auto-saves as you build. Use Save Game to name it or save over another world."}
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
