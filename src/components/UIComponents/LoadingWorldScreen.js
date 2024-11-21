import { useEffect, useRef, useState } from "react";

export const LoadingWorldScreen = ({ buildWorkers, chunksMadeCounter }) => {
  const [timeSoFar, setTSF] = useState(0);
  const loadingScreenHtmlRef = useRef();

  useEffect(() => {
    if (!chunksMadeCounter.current.loaddone) {
      setTimeout(() => setTSF(timeSoFar + 1), 1000);
    }
    if (loadingScreenHtmlRef.current) {
      // console.log(loadingScreenHtmlRef.current.children[0].textContent)
      chunksMadeCounter.current["ref"] = {
        ref: loadingScreenHtmlRef.current,
        updateDisplay: updateDisplay,
      };

      // console.log(loadingScreenHtmlRef.current.children)
    }
  }, [timeSoFar]);

  function updateDisplay() {
    loadingScreenHtmlRef.current.children[0].textContent = `load done - ${
      chunksMadeCounter.current.loaddone ? "true" : "false"
    } -- ${chunksMadeCounter.current.track.count}/${
      chunksMadeCounter.current.track.max
    }`;
    // loadingScreenHtmlRef.current.children[1].textContent = ``
    // loadingScreenHtmlRef.current.children[2].textContent = ``
  }

  return (
    <div ref={loadingScreenHtmlRef}>
      <div id="loadingpage"></div>
      <div id="loadingpage">Building Workers {buildWorkers}</div>
      <div id="loadingpage">
        Load Time So Far: <span>{timeSoFar}</span>s
      </div>
    </div>
  );
};
