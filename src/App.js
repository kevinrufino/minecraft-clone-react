import { useState } from "react";
import settings from "./constants";
import { useOnlineConnection } from "./hooks/useOnlineConnection";
import TitleScreen from "./components/UIComponents/TitleScreen";
import CoreGame from "./components/CoreGame";

function App() {
  const establishedConn = useOnlineConnection();
  const [playerConfigReady, setPCR] = useState(false);

  function playerGivenGameSettings(obj) {
    settings.movewithJOY_BOOL = obj.movewithJOY_BOOL;
    setPCR(true);
  }

  if (!establishedConn) {
    //waiting screen while connecting to the online server
    return <div>Connecting to multiplayer server...</div>;
  }

  return playerConfigReady ? (
    <CoreGame />
  ) : (
    <TitleScreen playerGivenGameSettings={playerGivenGameSettings} />
  );
}

export default App;
