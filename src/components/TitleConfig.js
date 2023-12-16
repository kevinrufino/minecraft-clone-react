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

  let dirtgrass = {
    g1: "#70B443",
    g2: "#4D8B40",
    g3: "#457537",
    g4: "#395E2B",

    d1: "#C27F48",
    d2: "#A1663A",
    d3: "#84502B",
    d4: "#61391F",

    gr: "#6D6A65",
  };

  let woodstyleind = [
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g4",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g3",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g2",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",
    "g1",

    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",
    "d4",

    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",
    "d3",

    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
    "d1",
  ];

  return (
    <>
      <svg width={window.innerWidth} height={window.innerHeight} style={{ top: "20px", left: "20px" }}>
        <rect
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ fill: "black", strokeWidth: 1, stroke: "black" }}
        />
        {new Array(svginfo.sqauresize ** 2).fill(0).map((_, ind) => {
          let co = dirtgrass[woodstyleind[ind]];

          return (
            <rect
              id={`rect${ind}`}
              key={`SVGKey${ind}`}
              x={(ind % svginfo.sqauresize) * svginfo.pixelsize + svginfo.hor_offset}
              y={Math.floor(ind / svginfo.sqauresize) * svginfo.pixelsize + svginfo.vert_offset}
              width={svginfo.pixelsize}
              height={svginfo.pixelsize}
              style={{ fill: co, strokeWidth: 1, stroke: co }}
            />
          );
        })}
        <text
          y={svginfo.vert_offset + svginfo.pixelsize * 7}
          x={svginfo.hor_offset}
          className="minecraft-text2"
          style={{ fontSize: "min(82px,14vw)" }}
        >
          CLONECRAFT
        </text>
        <text
          y={svginfo.vert_offset + svginfo.pixelsize * 10}
          x={svginfo.hor_offset}
          className="minecraft-text3 text-center"
          style={{ fontSize: "min(50px,9vw)" }}
        >
          A MineCraft Clone
        </text>
        <g onClick={handleClickPlay}>
          <rect
            width={100}
            height={35}
            x={svginfo.hor_offset + svginfo.pixelsize * 6}
            y={svginfo.vert_offset + svginfo.pixelsize * 14}
            style={{ fill: "grey", strokeWidth: 1, stroke: "black" }}
            // rx="25"
          />
          <text
            y={svginfo.vert_offset + svginfo.pixelsize * 14 + 26}
            x={svginfo.hor_offset + svginfo.pixelsize * 6.1}
            className="minecraft-text3 text-center"
            style={{ fontSize: "28.8px" }}
          >
            PLAY
          </text>
        </g>
        Sorry, your browser does not support inline SVG.
      </svg>
      <div className="pageContainer">
        <div className="card">
          <div className="container">
            {/* <h4>
              <b>World Settings</b>
            </h4>

            <h4>
              <b>Play Choice</b>
            </h4> */}

            <div class="input-group">
              <label class="input-group-icon">Simple:</label>
              <div class="input-group-area">
                <input type="text" placeholder="Email Address" />
              </div>
            </div>
            <div class="input-group">
              {/* <div class="input-group-area"> */}
              <label class="input-group-icon">Depth Choice:</label>
              {/* </div> */}
              <div class="input-group-area">
                <input type="text" placeholder="Email Address" />
              </div>
            </div>

            <label class="input-group">
              <div class="input-group-icon">Income:</div>
              <div class="input-group-area">
                <input type="text" value="0.00" />
              </div>
              <div class="input-group-icon">$</div>
            </label>

            <button onClick={()=>{playerGivenGameSettings()}}>READY</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TitleConfig;
