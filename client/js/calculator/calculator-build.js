'use strict';

//
// ─── GENERATION-CALCULATOR ──────────────────────────────────────────────────────
//

// Операторы, операнды и их порядок в grid
export const keyboardSymbols = {
	operators: new Map([
		['%', 5],
		['C', 3],
		['⌫', 4],
		['/', 8],
		['*', 12],
		['-', 16],
		['+', 20],
		['+/-', 7],
		['^', 6],
		['(', 1],
		[')', 1],
		['=', 23],
	]),
	operands: new Map([
		['9', 11],
		['8', 10],
		['7', 9],
		['6', 15],
		['5', 14],
		['4', 13],
		['3', 19],
		['2', 18],
		['1', 17],
		['0', 22],
		['.', 21],
	]),
};

export function calculatorBuild(DOMElements) {
	const templateButton = DOMElements.keyboardButtonTemplate.html.content.querySelector(
		'.' + DOMElements.keyboardButton.class
	);

	for (let symbolCategory in keyboardSymbols) {
		for (let symbolKeyboard of keyboardSymbols[symbolCategory].keys()) {
			templateButton.textContent = symbolKeyboard;
			let button = templateButton.cloneNode(true);
			switch (symbolCategory) {
				case 'operators':
					button.classList.add(DOMElements.keyboardOperator.class);
					break;
				case 'operands':
					button.classList.add(DOMElements.keyboardOperand.class);
					break;
				default:
					break;
			}
			// Дополнительная стилизация кнопок
			if (keyboardSymbols[symbolCategory].get(symbolKeyboard) === 23)
				button.classList.add(DOMElements.keyboardEqual.class);
			if (keyboardSymbols[symbolCategory].get(symbolKeyboard) === 21)
				button.classList.add(DOMElements.keyboardLeftCorner.class);

			let orderGridButton = keyboardSymbols[symbolCategory].get(symbolKeyboard);
			button.style.order = orderGridButton;
			DOMElements.keyboardContainer.html.append(button);
		}
	}
}
