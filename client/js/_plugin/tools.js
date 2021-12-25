export function rnd(min, max, isRound = true) {
	if (isRound) return Math.floor(Math.random() * (max - min + 1)) + min;
	else return Math.random() * (max - min) + min;
}

export function checkInSight(target, funcVisible, funcUnvisible) {
	// Все позиции элемента
	const targetPosition = {
		top: window.pageYOffset + target.getBoundingClientRect().top,
		left: window.pageXOffset + target.getBoundingClientRect().left,
		right: window.pageXOffset + target.getBoundingClientRect().right,
		bottom: window.pageYOffset + target.getBoundingClientRect().bottom,
	};
	// Получаем позиции окна
	const windowPosition = {
		top: window.pageYOffset,
		left: window.pageXOffset,
		right: window.pageXOffset + document.documentElement.offsetWidth,
		bottom: window.pageYOffset + document.documentElement.offsetHeight,
	};

	if (
		targetPosition.bottom > windowPosition.top && // Если позиция нижней части элемента больше позиции верхней чайти окна, то элемент виден сверху
		targetPosition.top < windowPosition.bottom && // Если позиция верхней части элемента меньше позиции нижней чайти окна, то элемент виден снизу
		targetPosition.right > windowPosition.left && // Если позиция правой стороны элемента больше позиции левой части окна, то элемент виден слева
		targetPosition.left < windowPosition.right
	) {
		// Если позиция левой стороны элемента меньше позиции правой чайти окна, то элемент виден справа
		// Если элемент полностью видно, то запускаем следующий код
		funcVisible();
		return true;
	} else {
		// Если элемент не видно, то запускаем этот код
		funcUnvisible();
		return false;
	}
}

export function isHTMLElement(target) {
	return !isNull(target) && target instanceof HTMLElement;
}
export function isContains(target, selector) {
	if (isHTMLElement(target)) return !!target.querySelector(selector);
	else throw new Error('* Target is not HTMLElement!');
}
