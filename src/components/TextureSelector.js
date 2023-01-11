import { useEffect, useState } from "react"
import { useKeyboard } from "../hooks/useKeyboard";
import { useStore } from "../hooks/useStore";
import { dirtImg, grassImg, glassImg, logImg, woodImg } from '../images/images'

const images = {
	dirt: dirtImg,
	grass: grassImg,
	glass: glassImg,
	wood: woodImg,
	log: logImg,
}

export const TextureSelector = ({activeTexturePatchFix}) => {
    const [activeTexture, setTexture] = useStore((state) => [state.texture, state.setTexture])
    const {
        dirt,
        grass,
        glass,
        wood,
        log
    } = useKeyboard();

    useEffect(() => {
        const textures = {
            dirt, 
            grass, 
            glass, 
            wood, 
            log
        }
        
        const pressedTexture = Object.entries(textures).find(([k, v]) => v)

        window.addEventListener("wheel", event => {
            const texturesArray = [
                "dirt", 
                "grass", 
                "glass", 
                "wood",
                "log"
            ]
            const delta = Math.sign(event.deltaY);
            let arrayPos = texturesArray.indexOf(activeTexture);
            if (delta === -1 && arrayPos-1 > -1 ) {
                setTexture(texturesArray[arrayPos - 1])
                activeTexturePatchFix.current = texturesArray[arrayPos-1]
            }
            if (delta === 1 && arrayPos+1 < 5 ) {
                setTexture(texturesArray[arrayPos + 1])
                activeTexturePatchFix.current = texturesArray[arrayPos+1]
            }
        });
        if (pressedTexture) {
            setTexture(pressedTexture[0])
            activeTexturePatchFix.current = pressedTexture[0]
        }
    }, [setTexture, dirt, grass, glass, wood, log, activeTexture])

    return (
        <div className="absolute centered-bottom texture-selector">
            {Object.entries(images).map(([k, src]) => {
                return (
                    <img key={k} src={src} alt={k} className={`${k === activeTexture ? 'active' : ''}`} />
                )
            })}
        </div>
    )
}