class Animation {
	constructor({
		duration = 2000,
		drawFunc = (progress, target) => {
			target.style.width = progress * 100 + '%';
		},
		timingFunc = timeFraction => 1 - Math.sin(Math.acos(timeFraction)),
		_currentAnimation = null,
	}) {
		this.duration = duration;
		this.drawFunc = drawFunc;
		this.timingFunc = timingFunc;
		this._currentAnimation = _currentAnimation;
	}
	set currentAnimation(value) {
		this._currentAnimation = value;
	}
	get currentAnimation() {
		return this._currentAnimation;
	}
	play(target = null, { beforeStartFunc = () => {}, afterEndFunc = () => {} }) {
		if (this.currentAnimation !== null) {
			this.destroy();
		}
		if (typeof beforeStartFunc === 'function') beforeStartFunc();

		const start = performance.now();
		this.currentAnimation = requestAnimationFrame(
			function play(time) {
				let timeFraction = (time - start) / this.duration;
				if (timeFraction > 1) timeFraction = 1;

				let progress = this.timingFunc(timeFraction);
				this.drawFunc(progress, target);

				if (timeFraction < 1) {
					requestAnimationFrame(play.bind(this));
				} else {
					if (typeof afterEndFunc === 'function') afterEndFunc();
					this.destroy();
				}
			}.bind(this)
		);
	}
	destroy() {
		cancelAnimationFrame(this.currentAnimation);
		this.currentAnimation = null;
	}
}

export default Animation;

export function play(target = null, settings) {
	const anim = new Animation({});
	anim.play(target, settings);
}

const lg = document.querySelector('.footer__logo');
play(lg, {});
