class Animation {
	constructor(settings) {
		this.duration = 2000;
		this.drawFunc = (progress, target) => {
			target.style.width = progress * 100 + '%';
		};
		this.timingFunc = timeFraction => 1 - Math.sin(Math.acos(timeFraction));

		if (typeof settings !== 'undefined')
			for (let param in settings) {
				if (param in this) this[param] = settings[param];
			}

		this._currentAnimation = undefined;
	}
	set currentAnimation(value) {
		this._currentAnimation = value;
	}
	get currentAnimation() {
		return this._currentAnimation;
	}
	async play(target, settings) {
		const {
			reversAnim = false,
			reversTiming = false,
			beforeStartFunc = () => {},
			afterEndFunc = () => {},
			duration = undefined,
			drawFunc = undefined,
			timingFunc = undefined,
		} = typeof settings === 'undefined' ? {} : settings;

		const _duration = duration !== undefined ? duration : this.duration;
		const _drawFunc = drawFunc !== undefined ? drawFunc : this.drawFunc;
		const _timingFunc = timingFunc !== undefined ? timingFunc : this.timingFunc;

		if (this.currentAnimation !== null) {
			this.destroy();
		}
		if (typeof beforeStartFunc === 'function') beforeStartFunc();
		const start = performance.now();
		let isCompleted = new Promise((resolve, reject) => {
			this.currentAnimation = requestAnimationFrame(
				function play(time) {
					let timeFraction = (time - start) / _duration;
					if (reversAnim) timeFraction = 1 - timeFraction;

					if (timeFraction > 1) timeFraction = 1;
					if (timeFraction < 0) timeFraction = 0;

					let progress = reversTiming ? timingFuncRevers.call(this) : _timingFunc(timeFraction);
					_drawFunc(progress, target);

					if ((timeFraction < 1 && !reversAnim) || (timeFraction > 0 && reversAnim)) {
						requestAnimationFrame(play.bind(this));
					} else {
						if (typeof afterEndFunc === 'function') afterEndFunc();
						this.destroy();
						resolve(true);
					}

					function timingFuncRevers() {
						return 1 - _timingFunc(1 - timeFraction);
					}
				}.bind(this)
			);
		});
		return await isCompleted;
	}
	destroy() {
		cancelAnimationFrame(this.currentAnimation);
		this.currentAnimation = null;
	}
}

export default Animation;

export async function play(target = null, settings) {
	const anim = new Animation();
	return await anim.play(target, settings);
}

// const lg = document.querySelector('.footer__logo');
// const res = play(lg);
// res.then(resolve => console.log('Animation play completed'));
