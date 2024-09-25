import { useState } from "react";
import { useStore } from "./hooks/useStore";
import settings from "./constants";
import { MakeOnlineConnection } from "./components/multiplayerComponents/MakeOnlineConnection";
import TitleScreen from "./components/UIComponents/TitleScreen";
import CoreGame from "./components/CoreGame";

function App() {
  const [establishedConn] = useStore((state) => [state.establishedConn]); //begining of online play

  const [playerConfigReady, setPCR] = useState(false);

  function gettingWorldLoadScreen() {
    //this is meant to be a place holder for a potential loading screen as we generate enough of the world before the player.
    //also a waiting screen for when some one is waiting to connect to online server
    //@TODO: MakeOnlineConnection should be a hook
    return (
      <>
        <div>Getting World</div>
        <MakeOnlineConnection />
      </>
    );
  }

  function playerGivenGameSettings(obj) {
    console.log("from player given game settings");
    settings.movewithJOY_BOOL = obj.movewithJOY_BOOL;
    setPCR(true);
  }

  return establishedConn ? (
    playerConfigReady ? (
      <CoreGame />
    ) : (
      <TitleScreen playerGivenGameSettings={playerGivenGameSettings} />
    )
  ) : (
    gettingWorldLoadScreen()
  );
}

export default App;
