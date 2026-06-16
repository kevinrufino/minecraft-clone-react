import { useState } from "react";
import { dirtImg } from "../../images/images";
import {
  listSaves,
  deleteSave,
  createSaveId,
  randomSeed,
} from "../../world/saves";

// Where players grab the multiplayer server to self-host.
const SERVER_REPO = "https://github.com/GreyDaCaLa/ReactMineCraftCloneServer";

function formatWhen(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

const TitleScreen = ({ playerGivenGameSettings }) => {
  // main | new | load | multiplayer
  const [view, setView] = useState("main");
  const [seed, setSeed] = useState("");
  const [name, setName] = useState("Player");
  const [showSetup, setShowSetup] = useState(false);
  const [saves, setSaves] = useState(() => listSaves());

  function start({ onlineEnabled, seed, saveId }) {
    playerGivenGameSettings({
      movewithJOY_BOOL: window.innerWidth < 400,
      onlineEnabled,
      playerName: name.trim() || "Player",
      seed,
      saveId,
    });
  }

  function handleCreateWorld() {
    const chosen = seed.trim() || randomSeed();
    start({ onlineEnabled: false, seed: chosen, saveId: createSaveId() });
  }

  function handleLoad(save) {
    start({ onlineEnabled: false, seed: save.seed, saveId: save.id });
  }

  function handleDelete(id) {
    deleteSave(id);
    setSaves(listSaves());
  }

  function handleJoinMultiplayer() {
    start({ onlineEnabled: true, seed: "robo", saveId: null });
  }

  function goMain() {
    setView("main");
    setShowSetup(false);
  }

  return (
    <div className="title-screen">
      <div
        className="title-screen__bg"
        style={{ backgroundImage: `url(${dirtImg})` }}
      />
      <div className="title-screen__overlay" />

      <div className="title-screen__content">
        <h1 className="title-screen__logo">CloneCraft</h1>

        <div className="title-screen__panel">
          {view === "main" && (
            <div className="ts-menu">
              <button
                className="mc-menu-btn"
                onClick={() => {
                  setSeed("");
                  setView("new");
                }}
              >
                <span className="mc-menu-btn__title">New World</span>
                <span className="mc-menu-btn__desc">
                  Generate a fresh world
                </span>
              </button>

              <button
                className="mc-menu-btn"
                onClick={() => {
                  setSaves(listSaves());
                  setView("load");
                }}
              >
                <span className="mc-menu-btn__title">Load World</span>
                <span className="mc-menu-btn__desc">
                  Continue a saved world
                </span>
              </button>

              <button
                className="mc-menu-btn"
                onClick={() => setView("multiplayer")}
              >
                <span className="mc-menu-btn__title">Multiplayer</span>
                <span className="mc-menu-btn__desc">
                  Play with friends on your server
                </span>
              </button>
            </div>
          )}

          {view === "new" && (
            <div className="ts-view">
              <h2 className="ts-subhead">New World</h2>
              <div className="mc-field">
                <label className="mc-label" htmlFor="ts-seed">
                  World Seed (optional)
                </label>
                <input
                  id="ts-seed"
                  className="mc-input"
                  type="text"
                  value={seed}
                  maxLength={32}
                  placeholder="Leave blank for a random seed"
                  onChange={(e) => setSeed(e.target.value)}
                />
                <p className="ts-hint">
                  The same seed always generates the same terrain.
                </p>
              </div>
              <button className="mc-play-btn" onClick={handleCreateWorld}>
                Create World
              </button>
              <button className="ts-back" onClick={goMain}>
                ‹ Back
              </button>
            </div>
          )}

          {view === "load" && (
            <div className="ts-view">
              <h2 className="ts-subhead">Load World</h2>
              {saves.length === 0 ? (
                <p className="ts-empty">
                  No saved worlds yet. Start a New World, then use Save Game in
                  the pause menu (Esc) to keep it.
                </p>
              ) : (
                <ul className="save-list">
                  {saves.map((s) => (
                    <li key={s.id} className="save-row">
                      <button
                        className="save-row__main"
                        onClick={() => handleLoad(s)}
                      >
                        <span className="save-row__name">{s.name}</span>
                        <span className="save-row__meta">
                          seed: {s.seed}
                          {formatWhen(s.updatedAt)
                            ? ` · ${formatWhen(s.updatedAt)}`
                            : ""}
                        </span>
                      </button>
                      <button
                        className="save-row__del"
                        title="Delete save"
                        onClick={() => handleDelete(s.id)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button className="ts-back" onClick={goMain}>
                ‹ Back
              </button>
            </div>
          )}

          {view === "multiplayer" && (
            <div className="ts-view">
              <h2 className="ts-subhead">Multiplayer</h2>
              <p className="ts-text">
                CloneCraft multiplayer runs on a small server that{" "}
                <strong>you host yourself</strong>. Everyone who connects to it
                shares the same world in real time.
              </p>

              <button
                className="ts-link-btn"
                onClick={() => setShowSetup((v) => !v)}
              >
                {showSetup ? "Hide setup ▲" : "Learn more — how to set it up ▼"}
              </button>

              {showSetup && (
                <ol className="mp-steps">
                  <li>
                    Download the server from{" "}
                    <a
                      className="mp-link"
                      href={SERVER_REPO}
                      target="_blank"
                      rel="noreferrer"
                    >
                      GitHub
                    </a>
                    .
                  </li>
                  <li>
                    In the server folder run <code>npm install</code>, then{" "}
                    <code>npm start</code> (it listens on port{" "}
                    <code>5050</code>).
                  </li>
                  <li>
                    Leave this game pointed at <code>localhost:5050</code> (the
                    default) and click Join below.
                  </li>
                  <li>
                    Open the game in another tab or device to join the same
                    world automatically.
                  </li>
                </ol>
              )}

              <div className="mc-field">
                <label className="mc-label" htmlFor="ts-name">
                  Player Name
                </label>
                <input
                  id="ts-name"
                  className="mc-input"
                  type="text"
                  value={name}
                  maxLength={16}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <button className="mc-play-btn" onClick={handleJoinMultiplayer}>
                Join
              </button>
              <p className="ts-hint">
                No server running? The game falls back to singleplayer.
              </p>
              <button className="ts-back" onClick={goMain}>
                ‹ Back
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="title-screen__footer">CloneCraft — a Minecraft clone</div>
    </div>
  );
};

export default TitleScreen;
