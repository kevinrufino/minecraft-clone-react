const TitleScreen = ({ playerGivenGameSettings }) => {
  function handleClickPlay() {
    // small screens get the touch joystick controls
    playerGivenGameSettings({ movewithJOY_BOOL: window.innerWidth < 400 });
  }

  return (
    <>
      <div className="TitleCard_Container">
        <div
          className="TitleCard_ColorBlock"
          style={{ backgroundColor: "#395E2B", height: "6.25%" }}
        />
        <div
          className="TitleCard_ColorBlock"
          style={{ backgroundColor: "#457537", height: "6.25%" }}
        />
        <div
          className="TitleCard_ColorBlock"
          style={{ backgroundColor: "#4D8B40", height: "6.25%" }}
        />
        <div
          className="TitleCard_ColorBlock"
          style={{ backgroundColor: "#70B443", height: "6.25%" }}
        />
        <div
          className="TitleCard_ColorBlock"
          style={{ backgroundColor: "#84502B", height: "25%" }}
        >
          <div
            className="text-center minecraft-text2"
            style={{ fontSize: "min(75px,14vw)" }}
          >
            CloneCraft
          </div>
        </div>
        <div
          className="TitleCard_ColorBlock"
          style={{ backgroundColor: "#A1663A", height: "25%" }}
        >
          <div
            className="minecraft-text3 text-center"
            style={{ fontSize: "min(50px,9vw)" }}
          >
            A MineCraft Clone
          </div>
        </div>
        <div
          className="TitleCard_ColorBlock"
          style={{ backgroundColor: "#C27F48", height: "25%" }}
        >
          <input
            type="button"
            value={"PLAY"}
            onClick={() => {
              handleClickPlay();
            }}
          />
        </div>
      </div>
    </>
  );
};

export default TitleScreen;
