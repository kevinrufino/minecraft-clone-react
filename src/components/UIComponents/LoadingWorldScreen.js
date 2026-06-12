import { useEffect, useRef, useState } from "react";
import { dirtImg } from "../../images/images";

export const LoadingWorldScreen = ({ buildWorkers, chunksMadeCounter }) => {
  const [tick, setTick] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const intervalRef = useRef(null);

  // Wire the imperative contract: chunksMadeCounter.current.ref = { ref, updateDisplay }
  // updateDisplay triggers a re-render via setTick so the progress bar updates.
  useEffect(() => {
    function updateDisplay() {
      setTick((t) => t + 1);
    }

    chunksMadeCounter.current["ref"] = {
      ref: null, // not needed for DOM manipulation any more
      updateDisplay,
    };

    // Backup poll in case updateDisplay stops being called after loaddone
    intervalRef.current = setInterval(() => {
      if (chunksMadeCounter.current.loaddone) {
        setTick((t) => t + 1);
      }
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // chunksMadeCounter is a stable ref — no dep needed

  // When loaddone goes true, start the fade-out then unmount
  useEffect(() => {
    if (chunksMadeCounter.current.loaddone && !fadeOut) {
      setFadeOut(true);
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  });

  if (!visible) return null;

  const track = chunksMadeCounter.current.track;
  const pct =
    track.max > 0 ? Math.min(100, Math.round((track.count / track.max) * 100)) : 0;

  return (
    <div
      className={`loading-screen${fadeOut ? " loading-screen--fade" : ""}`}
      style={{ backgroundImage: `url(${dirtImg})` }}
    >
      <div className="loading-screen__overlay" />
      <div className="loading-screen__content">
        <h2 className="loading-screen__title">Building world...</h2>
        <div className="loading-screen__bar-track">
          <div
            className="loading-screen__bar-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="loading-screen__pct">{pct}%</div>
        {buildWorkers > 0 && (
          <div className="loading-screen__workers">
            Workers ready: {buildWorkers}
          </div>
        )}
      </div>
    </div>
  );
};
