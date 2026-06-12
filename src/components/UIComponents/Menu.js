import { useStore } from "../../hooks/useStore";
import settings from "../../constants";

export const Menu = () => {
  const [online_resetWorld] = useStore((state) => [state.online_resetWorld]);

  return (
    <div className="menu absolute">
      <button
        onClick={() =>
          settings.onlineEnabled
            ? online_resetWorld()
            : window.location.reload()
        }
      >
        Reset
      </button>
    </div>
  );
};
