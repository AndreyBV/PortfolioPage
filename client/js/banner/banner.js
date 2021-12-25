import Glitch from '../_plugin/glitch.js';

const target = document.querySelector('.banner__title');
const settingsGlitch = {
	numberGlitchElements: 10,
	textPosition: { minX: -50, minY: -25, maxX: 50, maxY: 25 },
	sizeGlitchBox: { maxWidth: 600, maxHeight: 35 },
	frequency: { min: 3, max: 15 },
	background: '#242933',
	color: 'white',
};
const glitch = new Glitch(target, 'banner_glitch', settingsGlitch);
glitch.start();
