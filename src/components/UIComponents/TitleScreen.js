import { useState } from "react";
import { dirtImg } from "../../images/images";

const TitleScreen = ({ playerGivenGameSettings }) => {
  const [name, setName] = useState("Player");
  const [seed, setSeed] = useState("robo");
  const [mode, setMode] = useState("singleplayer");

  function handleClickPlay() {
    playerGivenGameSettings({
      movewithJOY_BOOL: window.innerWidth < 400,
      onlineEnabled: mode === "multiplayer",
      playerName: name.trim() || "Player",
      seed: seed.trim() || "robo",
    });
  }

  return (
    <div className="title-screen">
      <div className="title-screen__bg" style={{ backgroundImage: `url(${dirtImg})` }} />
      <div className="title-screen__overlay" />

      <div className="title-screen__content">
        <h1 className="title-screen__logo">CloneCraft</h1>

        <div className="title-screen__panel">
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

          <div className="mc-field">
            <label className="mc-label" htmlFor="ts-seed">
              World Seed
            </label>
            <input
              id="ts-seed"
              className="mc-input"
              type="text"
              value={seed}
              maxLength={32}
              onChange={(e) => setSeed(e.target.value)}
            />
          </div>

          <div className="mc-field">
            <div className="mc-mode-row">
              <button
                className={`mc-mode-btn${mode === "singleplayer" ? " mc-mode-btn--active" : ""}`}
                onClick={() => setMode("singleplayer")}
              >
                Singleplayer
              </button>
              <button
                className={`mc-mode-btn${mode === "multiplayer" ? " mc-mode-btn--active" : ""}`}
                onClick={() => setMode("multiplayer")}
              >
                Multiplayer
              </button>
            </div>
          </div>

          <button className="mc-play-btn" onClick={handleClickPlay}>
            PLAY
          </button>
        </div>
      </div>

      <div className="title-screen__footer">CloneCraft — a Minecraft clone</div>
    </div>
  );
};

export default TitleScreen;
