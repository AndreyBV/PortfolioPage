import { calculatorBuild } from './calculator-build.js';

//
// ─── CALCULATOR ─────────────────────────────────────────────────────────────────
//

class Calculator {
	constructor(DOMElements) {
		this.DOM = DOMElements;
		calculatorBuild(DOMElements);
		this._expressionDisplay = this.DOM.displayExpression.html.innerText;
		this._resultDisplay = this.DOM.displayResult.html.innerText;

		this.currentInput = '';
		this.historyInputRaw = [];
		this.limitRawHistory = 3;

		this._historyInputFiltered = [];
		this._lastInput = '';
		this._result = NaN;

		this.solutionExpression = [];
		this.historyCalculation = [];
		this.priorityOperators = new Map([
			[15, ['^']],
			[14, ['*', '/', '%']],
			[13, ['+', '-']],
		]);
		this.initial();
	}
	initial() {
		this.DOM.calculatorBody.html.addEventListener('click', this);
		this.DOM.calculatorBody.html.addEventListener('keydown', this);

		this.historyInputFiltered = new Proxy(this._historyInputFiltered, {
			get: (target, prop, receiver) => {
				return Reflect.get(target, prop, receiver);
			},
			set: (target, prop, value, receiver) => {
				target[prop] = value;
				this.updateExpressionDisplay();
				this.updateResultDisplay();
				return Reflect.set(target, prop, value, receiver);
			},
		});
		Object.defineProperty(this, 'historyInput', {
			writable: false,
		});

		this.conditions = {
			isOperand: () => this.isNumber(this.currentInput) || this.isDot(this.currentInput),
			fillingOperand: () => this.isNumber(this.lastInput) || this.isDot(this.currentInput),
			isOperator: () => !this.isNumber(this.currentInput) && !this.isDot(this.currentInput),

			atStart: () => this.historyInputFiltered.length === 0,

			afterEqual: () => this.historyInputRaw[1] === '=' && !isNaN(this.result),
			reOperator: () =>
				!this.isDot(this.currentInput) &&
				!this.isNumber(this.currentInput) &&
				!this.isNumber(this.lastInput) &&
				!this.conditions.isLastBracket() &&
				this.historyInputFiltered.length !== 0,
			chainOperators: () =>
				!this.isDot(this.currentInput) &&
				!this.isNumber(this.currentInput) &&
				!this.isNumber(this.historyInputFiltered[1]) &&
				this.historyInputFiltered[1] !== undefined &&
				!this.conditions.isBrackets(),

			reEqual: () => this.historyInputRaw[1] === '=' && this.currentInput === '=',
			operatorEqual: () => !this.isNumber(this.lastInput) && this.currentInput === '=',
			badEqual: () => this.isNumber(this.lastInput) && this.historyInputFiltered.length === 1,

			operandOperator: () =>
				(this.isNumber(this.lastInput) || this.conditions.isLastBracket()) &&
				!this.isNumber(this.currentInput),

			isBrackets: () => ~this.historyInputFiltered.indexOf('('),
			isLastBracket: () => this.lastInput === ')' || this.lastInput === '(',
			afterOpenBracket: () => !this.isNumber(this.currentInput) && this.lastInput === '(',
		};
		Object.defineProperty(this, 'conditions', {
			writable: false,
		});
	}

	get lastInput() {
		if (this.historyInputFiltered.length > 0) {
			this._lastInput = this.historyInputFiltered[0];
		} else this._lastInput = undefined;
		return this._lastInput;
	}
	set lastInput(value) {
		this.historyInputFiltered[0] = value;
		this._lastInput = this.historyInputFiltered[0];
	}

	get result() {
		return this._result;
	}
	set result(value) {
		this._result = value;
		this.updateExpressionDisplay();
		this.updateResultDisplay();
	}

	get expressionDisplay() {
		return this._expressionDisplay;
	}
	set expressionDisplay(value) {
		this._expressionDisplay = value;
		this.DOM.displayExpression.html.innerText = value;
	}
	get resultDisplay() {
		return this._resultDisplay;
	}
	set resultDisplay(value) {
		this._resultDisplay = value;
		this.DOM.displayResult.html.innerText = value;
	}

	debagInfo(title) {
		console.log('--------- ' + title);
		console.log(this);
		console.log(this.reversArray(this.historyInputFiltered));
	}

	//
	// ───────────────────────────────────────────────────── USER ACTION HANDLERS ─────
	//

	handleEvent(event) {
		let method = 'on' + event.type[0].toUpperCase() + event.type.slice(1);
		this[method](event);
	}
	onKeydown(event) {
		this.currentInput = event.key;
		this.handlerInput();
	} // Ввод с клавиатуры

	onClick(event) {
		let target = event.target;
		if (target.classList.contains(this.DOM.keyboardButton.class)) {
			this.currentInput = target.innerText;
			this.handlerInput();
		} // Клик по какой-либо кнопке клавиатуры калькулятора
		else if (target.classList.contains(this.DOM.displayContainer.class)) {
		} // Клик по дисплею
	}

	//
	// ────────────────────────────────────────────────────────────── MAIN LOGIC ─────
	//

	handlerInput() {
		this.historyInputRaw.unshift(this.currentInput);
		this.historyInputRaw.splice(this.limitRawHistory, this.historyInputRaw.length - 1);
		switch (this.currentInput) {
			case 'C':
			case 'Delete':
				this.reset();
				break;
			case '⌫':
			case 'Backspace':
				this.removeDigit();
				break;
			case '+/-':
				this.invertSign();
				break;
			case '(':
			case ')':
				this.setBracket();
				break;
			case '=':
			case 'Enter':
				this.getResult();
				break;
			default:
				this.updateExpression(); // + - / * % ^
				break;
		}
	}

	reset() {
		this.expressionDisplay = '';
		this.resultDisplay = '0';

		this.currentInput = '';
		this.lastInput = '';

		this.historyInputRaw.length = 0;
		this.historyInputFiltered.length = 0;
		this.result = NaN;

		this.solutionExpression = [];
		this.historyCalculation = [];
	}

	removeDigit() {
		if (this.conditions.afterEqual()) {
			this.historyInputFiltered.length = 0;
			this.historyInputFiltered.unshift(this.result);
		} else if (this.isNumber(this.lastInput)) {
			if (this.lastInput.length === 2 && +this.lastInput < 0) this.lastInput = '';
			this.lastInput = this.lastInput.slice(0, this.lastInput.length - 1);
			if (this.lastInput === '') this.historyInputFiltered.shift();
		}
		this.result = NaN;
		this.debagInfo('remove');
	}

	invertSign() {
		if (this.conditions.afterEqual()) {
			this.historyInputFiltered.length = 0;
			this.historyInputFiltered.unshift(String(this.result * -1));
		} else if (this.isNumber(this.lastInput)) this.lastInput = String(this.lastInput * -1);
		console.log(this.lastInput);
		this.result = NaN;
		this.debagInfo('invert');
	}

	setBracket() {
		if (this.conditions.afterEqual()) {
			this.historyInputFiltered.length = 0;
		}
		if (this.currentInput === '(')
			if (!this.isNumber(this.lastInput)) this.historyInputFiltered.unshift(this.currentInput);
			else {
				const tmpLastInput = this.lastInput;
				this.lastInput = this.currentInput;
				this.historyInputFiltered.unshift(tmpLastInput);
			}
		else if (this.currentInput === ')') {
			const [openBrackets, closeBrackets] = this.getOpenCloseBrackets.call(this);
			if (openBrackets.length > closeBrackets.length) this.historyInputFiltered.unshift(this.currentInput);
		}
		this.result = NaN;
		this.debagInfo('Brackets');
	}
	fillingBrackets() {
		const [openBrackets, closeBrackets] = this.getOpenCloseBrackets.call(this);
		const numberOpenBrackets = openBrackets.length;
		let numberCloseBrackets = closeBrackets.length;

		while (numberOpenBrackets > numberCloseBrackets) {
			this.historyInputFiltered.unshift(')');
			numberCloseBrackets++;
		}
	}
	getOpenCloseBrackets() {
		const stringExpression = this.historyInputFiltered.join('');
		const openBrackets = Array.from(stringExpression.matchAll('\\('));
		const closeBrackets = Array.from(stringExpression.matchAll('\\)'));
		return [openBrackets, closeBrackets];
	}

	getResult() {
		if (this.conditions.reEqual()) {
			const lastOperand = this.historyInputFiltered.find(item => this.isNumber(item));
			const lastOperator = this.historyInputFiltered.find(
				item => !this.isNumber(item) && !this.isBracket(item)
			);
			this.historyInputFiltered.length = 0;
			if (lastOperator !== undefined) {
				this.historyInputFiltered.unshift(this.result);
				this.historyInputFiltered.unshift(lastOperator);
				this.historyInputFiltered.unshift(lastOperand);
			}
		} else if (this.conditions.operatorEqual()) this.historyInputFiltered.unshift(this.resultDisplay);
		if (this.currentInput === '=') this.fillingBrackets(true);
		const expression = this.expressionFormatting(this.historyInputFiltered);
		this.result = this.calculateBracketExpression(expression);
		this.debagInfo('result');
	}

	updateExpression() {
		this.inputOperand();
		this.inputOperator();
	}
	inputOperand() {
		if (this.conditions.isOperand()) {
			if (this.conditions.afterEqual() || this.lastInput === ')') {
				this.historyInputFiltered.length = 0;
			}
			if (this.conditions.fillingOperand()) {
				let number = this.lastInput;

				if (this.isDot(this.currentInput)) {
					if (!this.isNumber(number)) {
						this.historyInputFiltered.unshift('0' + this.currentInput);
						return;
					} else if (~this.lastInput.indexOf('.')) return;
				}

				this.lastInput = number + this.currentInput;
			} else this.historyInputFiltered.unshift(this.currentInput);
			this.debagInfo('operand');
		}
	}
	inputOperator() {
		if (this.conditions.isOperator()) {
			console.log(this.historyInputFiltered.length);
			if (this.conditions.afterEqual()) {
				this.historyInputFiltered.length = 0;
				this.historyInputFiltered.unshift(this.result);
			}
			if (this.conditions.atStart()) {
				console.log(111111111);
				this.historyInputFiltered.unshift(this.resultDisplay);
				this.historyInputFiltered.unshift(this.currentInput);
			}
			if (this.conditions.afterOpenBracket()) {
				this.historyInputFiltered.unshift(this.resultDisplay);
			}
			if (this.conditions.reOperator()) {
				this.lastInput = this.currentInput;
			}
			if (this.conditions.chainOperators()) {
				this.getResult();
			}
			if (this.conditions.operandOperator()) {
				this.historyInputFiltered.unshift(this.currentInput);
			}
			this.debagInfo('operator');
		}
	}

	updateExpressionDisplay() {
		let expressionDisplayValue = null;
		if (this.isNumber(this.lastInput) && this.currentInput !== '=')
			expressionDisplayValue = this.historyInputFiltered.slice(1);
		else expressionDisplayValue = this.historyInputFiltered;
		this.expressionDisplay = this.expressionFormatting(expressionDisplayValue);
	}
	updateResultDisplay() {
		if (!isNaN(this.result) && (this.currentInput === '=' || !this.isNumber(this.lastInput))) {
			this.resultDisplay = this.result;
			return;
		}
		if (this.isNumber(this.lastInput)) this.resultDisplay = this.lastInput;
		if (this.lastInput === undefined || (this.currentInput === '⌫' && !this.isNumber(this.lastInput)))
			this.resultDisplay = '0';
	}

	expressionFormatting(expressionArray) {
		return this.reversArray(expressionArray).join(' ').replaceAll('( ', '(').replaceAll(' )', ')');
	}

	//
	// ────────────────────────────────────────────────────── EXPRESSION HANDLERS ─────
	//

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
		const result = String(+(+inputExpression).toFixed(3));
		return result;
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
				return leftOperand;
		}
	}

	isBracket(value) {
		return value === ')' || value === '(';
	}
	isNumber(value) {
		return !isNaN(parseFloat(value)) && !isNaN(value - 0);
	}
	isBracket(value) {
		return value === ')' || value === '(';
	}
	isDot(value) {
		return value === '.';
	}
	reversArray(array) {
		return array.map(array.pop, [...array]);
	}
}

const DOMElements = {
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
for (let calculatorElement in DOMElements) {
	DOMElements[calculatorElement] = {
		class: DOMElements[calculatorElement],
		html: document.querySelector('.' + DOMElements[calculatorElement]),
	};
}

const calculator = new Calculator(DOMElements);
