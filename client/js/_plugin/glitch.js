import { rnd, checkInSight, isContains } from '../_plugin/tools.js';

class Glitch {
	constructor(
		target = null,
		classNameGlitchBlock = 'glitch',
		settings = {
			numberGlitchElements: 10,
			textPosition: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
			sizeGlitchBox: { maxWidth: 0, maxHeight: 0 },
			frequency: { min: 3, max: 10 }, // per seconds
			background: 'black',
			color: 'white',
		}
	) {
		this.target = target;
		this.classNameGlitchBlock = classNameGlitchBlock;
		this.settings = settings;
		this.timer = null;
	}

	start() {
		this.buildGlitch();
		this.glitchLoop();
		window.addEventListener('scroll', e => {
			this.checkInSightGlitch();
		});
	}
	stop() {
		clearTimeout(this.timer);
		this.timer = null;
		window.removeEventListener('scroll', e => {
			this.checkInSightGlitch();
		});
	}
	// Оптимизатор - если глитч элемент не видно, то он не обновляется
	checkInSightGlitch() {
		return checkInSight(
			this.target,
			() => {
				if (this.timer === null) this.start();
			},
			() => this.stop()
		);
	}
	buildGlitch() {
		if (!isContains(this.target, '.' + this.classNameGlitchBlock)) {
			this.target.style.position = 'relative';
			const glitchText = this.target.innerText;

			const glitchBox = document.createElement('div');
			glitchBox.className = this.classNameGlitchBlock;

			for (let i = 0; i < this.settings.numberGlitchElements; i++) {
				const glitchTextBox = document.createElement('div');
				glitchTextBox.className = this.classNameGlitchBlock + '-text-block';
				glitchTextBox.innerText = glitchText;
				glitchTextBox.style.position = 'absolute';
				glitchTextBox.style.color = this.settings.color;
				glitchTextBox.style.background = this.settings.background;

				glitchBox.appendChild(glitchTextBox);
				this.target.appendChild(glitchBox);
			}
		}
	}
	glitchLoop() {
		let glitchTextBoxes = document.querySelectorAll('.' + this.classNameGlitchBlock + '-text-block');
		if (true) {
			for (let i = 0; i < glitchTextBoxes.length; i++) {
				// Рандомный клипинг
				let Y1 = rnd(0, glitchTextBoxes[0].clientHeight) + 'px',
					X2 = rnd(0, glitchTextBoxes[0].clientWidth) + 'px',
					X1 = rnd(0, parseInt(X2) + this.settings.sizeGlitchBox.maxWidth) + 'px',
					Y2 = rnd(0, parseInt(Y1) + this.settings.sizeGlitchBox.maxHeight) + 'px';
				glitchTextBoxes[i].style.clip = `rect(${Y1}, ${X1}, ${Y2}, ${X2})`;
				// Рандомное позиционирование текста
				glitchTextBoxes[i].style.left =
					rnd(this.settings.textPosition.minX, this.settings.textPosition.maxX) + 'px';
				glitchTextBoxes[i].style.top =
					rnd(this.settings.textPosition.minY, this.settings.textPosition.maxY) + 'px';
			}
			let rndInterval = rnd(1 / this.settings.frequency.max, 1 / this.settings.frequency.min, false);
			this.timer = setTimeout(() => this.glitchLoop(), rndInterval * 1000);
		}
	}

	playSoundGlitch(delay = 1000) {
		setInterval(() => {
			let indexSound = rnd(1, 6);
			let dir = `./sounds/glitch/glitch_${indexSound}.aac`;
			const sound = new Audio(dir);
			sound.play();
		}, delay);
	}
}

export default Glitch;
