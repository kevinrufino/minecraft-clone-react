import { NearestFilter, TextureLoader, RepeatWrapping } from 'three'

import {
	dirtImg,
	logImg,
	grassImg,
	glassImg,
	woodImg,
	allMinecraft
} from './images'

const dirtTexture = new TextureLoader().load(dirtImg)
const logTexture = new TextureLoader().load(logImg)
const grassTexture = new TextureLoader().load(grassImg)
const glassTexture = new TextureLoader().load(glassImg)
const woodTexture = new TextureLoader().load(woodImg)
const groundTexture = new TextureLoader().load(grassImg)
const allMincraftTexture = new TextureLoader().load(allMinecraft)
const AMTmap = {
	'dirt': [3,16],
	'wood': [5,16],
	'grass': [5,3],
	'sand': [3,15],
	'wood': [5,16],
	'ground': [8,11],
	'barktop': [5,15],
	'log': [5,15],
	'bedrock': [2,15],
	'glass': [3,5]
}

dirtTexture.magFilter = NearestFilter;
logTexture.magFilter = NearestFilter;
grassTexture.magFilter = NearestFilter;
glassTexture.magFilter = NearestFilter;
woodTexture.magFilter = NearestFilter;
groundTexture.magFilter = NearestFilter;
allMincraftTexture.magFilter = NearestFilter;
groundTexture.wrapS = RepeatWrapping
groundTexture.wrapT = RepeatWrapping

export {
	dirtTexture,
	logTexture,
	grassTexture,
	glassTexture,
	woodTexture,
	groundTexture,
	allMincraftTexture,
	AMTmap
}