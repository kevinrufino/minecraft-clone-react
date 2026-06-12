import { useStore } from "../../hooks/useStore";
import { Basicplayer } from "./BasicPlayer";

export const OtherPlayers = () => {
  const [players] = useStore((state) => [state.players]);

  return (
    <>
      {Object.keys(players).map((pn) => {
        const player = players[pn];
        // Filter out players whose pos is [-10,-10,-10] (not-yet-spawned placeholder).
        if (
          player.pos[0] === -10 &&
          player.pos[1] === -10 &&
          player.pos[2] === -10
        ) {
          return null;
        }
        return (
          <Basicplayer
            mypos={player.pos}
            name={player.name || `Player ${pn}`}
            key={pn}
          />
        );
      })}
    </>
  );
};
