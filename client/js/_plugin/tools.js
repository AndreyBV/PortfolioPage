export function rnd(min, max, isRound = true) {
	if (isRound) return Math.floor(Math.random() * (max - min + 1)) + min;
	else return Math.random() * (max - min) + min;
}
