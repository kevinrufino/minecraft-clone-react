const TitleConfig = ({playerGivenGameSettings}) => {
  function handleClickPlay() {
    console.log("WOW");
  }

  let svginfo = {};
  svginfo.sqauresize = 16;
  svginfo.pixelsize =
    Math.floor(window.innerWidth / svginfo.sqauresize) < Math.floor(window.innerHeight / svginfo.sqauresize)
      ? Math.floor(window.innerWidth / svginfo.sqauresize)
      : Math.floor(window.innerHeight / svginfo.sqauresize);
  svginfo.hor_offset = (window.innerWidth - svginfo.sqauresize * svginfo.pixelsize) / 2;
  svginfo.vert_offset = (window.innerHeight - svginfo.sqauresize * svginfo.pixelsize) / 2;

  return (
    <>

      <div className="TitleCard_Container">
        <div className="TitleCard_ColorBlock" 
          style={{"backgroundColor":'#395E2B',"height":"6.25%"}}/>
        <div className="TitleCard_ColorBlock" 
          style={{"backgroundColor":'#457537',"height":"6.25%"}}/>
        <div className="TitleCard_ColorBlock" 
          style={{"backgroundColor":'#4D8B40',"height":"6.25%"}}/>
        <div className="TitleCard_ColorBlock" 
          style={{"backgroundColor":'#70B443',"height":"6.25%"}}/>
        <div className="TitleCard_ColorBlock" 
          style={{"backgroundColor":'#84502B',"height":"25%"}}>
            <div  className="text-center minecraft-text2" style={{ fontSize: "min(75px,14vw)" }}>
            CloneCraft
            </div>
            </div>
        <div className="TitleCard_ColorBlock" 
          style={{"backgroundColor":'#A1663A',"height":"25%"}}>
            <div 
            className="minecraft-text3 text-center"
            style={{ fontSize: "min(50px,9vw)" }}
            >
              A MineCraft Clone
            </div>
          </div>
        <div className="TitleCard_ColorBlock" 
          style={{"backgroundColor":'#C27F48',"height":"25%"}}>
            <input type="button" value={"PLAY"} onClick={()=>{handleClickPlay()}}/>
            </div>
      </div>
 
    </>
  );
};

export default TitleConfig;
