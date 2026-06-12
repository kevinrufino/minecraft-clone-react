import { useStore } from "../../hooks/useStore";
import { Basicplayer } from "./BasicPlayer";

export const OtherPlayers = () => {
  const [players] = useStore((state) => [state.players]);

  return (
    <>
      {Object.keys(players).map((pn) => {
        return <Basicplayer mypos={players[pn].pos} key={`player${pn}`} />;
      })}
    </>
  );
};
