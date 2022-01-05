//
// ─── STOPWATCH ──────────────────────────────────────────────────────────────────
//

class Stopwatch {
	constructor(updateFrequency = 20) {
		this.milliseconds = 0;
		this.timeStart = null;
		this.timeStop = null;
		this.timeout = null;
		this.delay = updateFrequency;
	}

	start(arrayFuncs) {
		this.timeStart = this.getTime('normal');

		this._brainStopwatch(arrayFuncs);
		this.timeout = setTimeout(() => {
			this.start(arrayFuncs);
		}, this.delay);

		return this.timeStart;
	}
	_brainStopwatch(arrayFuncs) {
		for (let funcObject of arrayFuncs) {
			if (typeof funcObject.func === 'function' && this._extraTimeout(funcObject.numberDelays))
				funcObject.func(this.milliseconds, this.delay);
		}
		this.milliseconds += this.delay;
	}
	_extraTimeout(numberDelays) {
		if (this.milliseconds !== 0 && (this.milliseconds / this.delay / numberDelays) % 1 === 0) return true;
		return false;
	}

	stop() {
		clearInterval(this.timeout);
		this.timeStop = this.getTime('normal');
		return this.timeStop;
	}

	reset() {
		clearInterval(this.timeout);
		this.milliseconds = 0;
		this.timeStart = null;
		this.timeStop = null;
		this.timeout = null;
	}

	getTime(type = 'normal') {
		let date = new Date(this.milliseconds);
		switch (type) {
			case 'normal':
				return date;
			case 'milliseconds':
				return date - this.timeStart;
			case 'decompose':
				return this._decomposeTime(date);
			default:
				new Error('This type is missing.');
		}
	}
	_decomposeTime(date) {
		return {
			hours: date.getUTCHours(),
			minutes: date.getMinutes(),
			seconds: date.getSeconds(),
			milliseconds: date.getMilliseconds(),
		};
	}
	toString() {
		const fullTime = this.getTime('decompose');
		if (Math.floor(this.milliseconds / 1000 / 60) == 0)
			return String(fullTime.seconds).padStart(2, '0') + 's';
		else if (Math.floor(this.milliseconds / 1000 / 60 / 60) == 0)
			return String(fullTime.minutes).padStart(2, '0') + ':' + String(fullTime.seconds).padStart(2, '0');
		else
			return (
				String(fullTime.hours).padStart(2, '0') +
				':' +
				String(fullTime.minutes).padStart(2, '0') +
				':' +
				String(fullTime.seconds).padStart(2, '0')
			);
	}
}

export default Stopwatch;
