class Animation {
	constructor({ duration, drawFunc, timingFunc }) {
		this.duration = duration;
		this.drawFunc = drawFunc;
		this.timingFunc = timingFunc;
		this._currentAnimation = null;
	}
	play() {}
	destroy() {}
}
