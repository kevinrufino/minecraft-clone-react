import { useStore } from "../../hooks/useStore"
import settings from "../../constants"

export const Menu = () => {
	const [saveWorld, resetWorld,online_resetWorld] = useStore((state) => [state.saveWorld, state.resetWorld, state.online_resetWorld])

	return (<div className="menu absolute">
		<button onClick={() => saveWorld()}>
            Save
        </button>
		<button	onClick={() => 
			settings.onlineEnabled ? online_resetWorld() : resetWorld()
		}>
            Reset
        </button>
	</div>)
}