import { useEffect, useState } from "react";
import settings from "../../constants";
import { useStore } from "../../hooks/useStore";

// Hold Tab to see who's online (Minecraft-style). Only shown in online mode.
// Player names + positions come from the store's `players` map, which the
// socket heartbeat keeps up to date.
export function PlayerList() {
  const players = useStore((s) => s.players);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === "Tab") {
        e.preventDefault(); // don't move browser focus
        setOpen(true);
      }
    }
    function onKeyUp(e) {
      if (e.code === "Tab") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  if (!settings.onlineEnabled || !open) {
    return null;
  }

  const me = settings.playerName || "You";
  const others = Object.keys(players).map(
    (pn) => players[pn]?.name || `Player ${pn}`,
  );
  const names = [`${me} (you)`, ...others];

  return (
    <div className="player-list">
      <div className="player-list__panel">
        <h3 className="player-list__title">Players ({names.length})</h3>
        <ul className="player-list__items">
          {names.map((n, i) => (
            <li key={i} className="player-list__item">
              {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
