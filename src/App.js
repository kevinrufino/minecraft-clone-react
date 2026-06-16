import { useState } from "react";
import settings from "./constants";
import { useOnlineConnection } from "./hooks/useOnlineConnection";
import TitleScreen from "./components/UIComponents/TitleScreen";
import CoreGame from "./components/CoreGame";

function App() {
  const [playerConfigReady, setPCR] = useState(false);
  const establishedConn = useOnlineConnection(playerConfigReady);

  // Called by the title screen once the player has picked a world/mode.
  function playerGivenGameSettings(config) {
    settings.movewithJOY_BOOL = config.movewithJOY_BOOL;
    settings.onlineEnabled = config.onlineEnabled;
    if (config.playerName) {
      settings.playerName = config.playerName;
    }
    if (config.seed) {
      settings.worldSettings.seed = config.seed;
    }
    settings.currentSaveId = config.saveId || null;
    setPCR(true);
  }

  if (!playerConfigReady) {
    return <TitleScreen playerGivenGameSettings={playerGivenGameSettings} />;
  }

  if (!establishedConn) {
    //waiting screen while connecting to the online server
    return <div className="connecting-screen">Connecting to server...</div>;
  }

  return <CoreGame />;
}

export default App;
