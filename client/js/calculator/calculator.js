//
// ─── CALCULATOR ─────────────────────────────────────────────────────────────────
//

const DOM = {
	calculatorBody: 'calculator__body',

	displayContainer: 'display-calculator',
	displayExpression: 'display-calculator__expression',
	displayResult: 'display-calculator__result',

	keyboardContainer: 'keyboard-calculator',
	keyboardButtonTemplate: 'keyboard-calculator__button-template',
	keyboardButton: 'keyboard-calculator__button',
	keyboardOperator: 'keyboard-calculator__button-operator',
	keyboardOperand: 'keyboard-calculator__button-operand',
	keyboardEqual: 'keyboard-calculator__button-equal',
	keyboardLeftCorner: 'keyboard-calculator__button-left-corner',

	historyContainer: 'history-calculator',
	historyBody: 'history-calculator__body',
	historyItem: 'history-calculator__item',
	historyItemExpression: 'history-calculator__expression',
	historyItemResult: 'history-calculator__result',
	historyClearButton: 'history-calculator__clear-button',
};

for (let calculatorElement in DOM) {
	console.log(DOM[calculatorElement]);

	DOM[calculatorElement] = {
		class: DOM[calculatorElement],
		html: document.querySelector('.' + DOM[calculatorElement]),
	};
}

console.log(DOM);
//
// ─── GENERATION-CALCULATOR ──────────────────────────────────────────────────────
//

// Операторы, операнды и их порядок в grid
const keyboardSymbols = {
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

function buildKeyboard() {
	const templateButton = DOM.keyboardButtonTemplate.html.content.querySelector(
		'.' + DOM.keyboardButton.class
	);

	for (let symbolCategory in keyboardSymbols) {
		for (let symbolKeyboard of keyboardSymbols[symbolCategory].keys()) {
			templateButton.textContent = symbolKeyboard;
			let button = templateButton.cloneNode(true);
			switch (symbolCategory) {
				case 'operators':
					button.classList.add(DOM.keyboardOperator.class);
					break;
				case 'operands':
					button.classList.add(DOM.keyboardOperand.class);
					break;
				default:
					break;
			}
			// Дополнительная стилизация кнопок
			if (keyboardSymbols[symbolCategory].get(symbolKeyboard) === 23)
				button.classList.add(DOM.keyboardEqual.class);
			if (keyboardSymbols[symbolCategory].get(symbolKeyboard) === 21)
				button.classList.add(DOM.keyboardLeftCorner.class);

			let orderGridButton = keyboardSymbols[symbolCategory].get(symbolKeyboard);
			button.style.order = orderGridButton;
			DOM.keyboardContainer.html.append(button);
		}
	}
}
buildKeyboard();

//
// ─── CALCULATOR LOGIC ───────────────────────────────────────────────────────────
//

class Calculator {
	constructor() {
		this.expressionDisplay = '';
		this.resultDisplay = '';

		this.currentInput = '';
		this.historyInput = '';
		this.result = 0;

		this.solutionExpression = [];
		this.historyCalculation = [];
		this.priorityOperators = new Map([
			[15, ['^']],
			[14, ['*', '/', '%']],
			[13, ['+', '-']],
		]);
	}

	updateExpressionDisplay() {}
	updateResultDisplay() {}

	calculateBracketExpression(inputExpression) {
		const closeBracketIndex = inputExpression.indexOf(')');
		const openBracketIndex = inputExpression.substring(0, closeBracketIndex).lastIndexOf('(');

		if (~closeBracketIndex && ~openBracketIndex) {
			const innerExpression = inputExpression.substring(openBracketIndex, closeBracketIndex + 1);
			let cleanInnerExpression = innerExpression.replace('(', '').replace(')', '');
			const resultExpression = this.calculateLongExpression(cleanInnerExpression);
			let updatedInnerExpression = inputExpression.replaceAll(innerExpression, resultExpression);
			return this.calculateBracketExpression(updatedInnerExpression);
		} else {
			return this.calculateLongExpression(inputExpression);
		}
	}
	calculateLongExpression(inputExpression) {
		for (let operators of this.priorityOperators.values()) {
			let operatorsExpression = inputExpression.split(' ').filter((item, index) => index % 2 == 1);
			operatorsExpression.map(item => {
				if (operators.includes(item)) {
					let patternExpression =
						'[-+]?[0-9]+[.,]?([0-9]+(?:[eE][-+]?[0-9]+)?)? \\' +
						item +
						' [-+]?[0-9]+[.,]?([0-9]+(?:[eE][-+]?[0-9]+)?)?';
					let innerExpression = inputExpression.match(patternExpression)[0];
					let partsInnerExpression = innerExpression.trim().split(' ');
					let resultExpression = this.calculateSimpleExpression(...partsInnerExpression);

					this.solutionExpression.push({
						expression: innerExpression + ' =',
						result: resultExpression,
					});
					inputExpression = inputExpression.replace(innerExpression, resultExpression);
				}
			});
		}
		return +inputExpression;
	}
	calculateSimpleExpression(leftOperand, operator, rightOperand) {
		switch (operator) {
			case '+':
				return parseFloat(leftOperand) + parseFloat(rightOperand);
			case '-':
				return parseFloat(leftOperand) - parseFloat(rightOperand);
			case '*':
				return parseFloat(leftOperand) * parseFloat(rightOperand);
			case '/':
				return parseFloat(leftOperand) / parseFloat(rightOperand);
			case '^':
				return Math.pow(parseFloat(leftOperand), parseFloat(rightOperand));
			case '%':
				return parseFloat(leftOperand) % parseFloat(rightOperand);
			default:
				break;
		}
	}
}

const calc = new Calculator();
let test = calc.calculateBracketExpression('(24 + 5) * (2 * 3) - 1');
console.log(test);
test = calc.calculateLongExpression('1 + 2 * 3 + 2 ^ 3 ^ 1');
console.log(test);
test = calc.calculateSimpleExpression('1', '+', '3');
console.log(test);
