import { calculatorBuild, keyboardSymbols } from './calculator-build.js';

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
			atStart: () => this.historyInputFiltered.length === 0,

			isDot: value => value === '.',
			isOperand: () => this.isNumber(this.currentInput) || this.conditions.isDot(this.currentInput),
			fillingOperand: () => this.isNumber(this.lastInput) || this.conditions.isDot(this.currentInput),
			isOperator: () => !this.isNumber(this.currentInput) && !this.conditions.isDot(this.currentInput),

			afterInfinity: () => +this.result === Infinity,
			afterEqual: () => this.historyInputRaw[1] === '=' && !isNaN(this.result),
			operatorAgain: () =>
				!this.conditions.isDot(this.currentInput) &&
				!this.isNumber(this.currentInput) &&
				!this.isNumber(this.lastInput) &&
				!this.conditions.afterBracket() &&
				this.historyInputFiltered.length !== 0,
			operatorsChain: () =>
				!this.conditions.isDot(this.currentInput) &&
				!this.isNumber(this.currentInput) &&
				!this.isNumber(this.historyInputFiltered[1]) &&
				this.historyInputFiltered[1] !== undefined &&
				!this.conditions.isContainsBrackets(),

			equalAgain: () => this.historyInputRaw[1] === '=' && this.currentInput === '=',
			equalAfterOperator: () =>
				!this.isNumber(this.lastInput) && !this.conditions.afterBracket() && this.currentInput === '=',

			operatorAfterOperand: () =>
				(this.isNumber(this.lastInput) || this.conditions.afterBracket()) &&
				!this.isNumber(this.currentInput),

			isContainsBrackets: () => ~this.historyInputFiltered.indexOf('('),
			isBracket: value => value === '(' || value === ')',
			afterOpenBracket: () => this.lastInput === '(',
			afterCloseBrackets: () => this.lastInput === ')',
			afterBracket: () => this.conditions.afterCloseBrackets() || this.conditions.afterOpenBracket(),
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
		console.log('reult disp');
		console.log(value);
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
		let input = event.key;
		if (event.key === 'Enter') input = '=';
		if (event.key === 'Backspace') input = '⌫';
		if (event.key === 'Delete') input = 'C';
		if ((event.altKey && event.key === '+') || (event.altKey && event.key === '-')) input = '+/-';

		if (
			keyboardSymbols.operands.get(input) !== undefined ||
			keyboardSymbols.operators.get(input) !== undefined
		) {
			this.currentInput = input;
			this.handlerInput();
		}
	} // Ввод с клавиатуры

	onClick(event) {
		let target = event.target;
		if (target.classList.contains(this.DOM.keyboardButton.class)) {
			if (
				keyboardSymbols.operands.get(target.innerText) !== undefined ||
				keyboardSymbols.operators.get(target.innerText) !== undefined
			) {
				this.currentInput = target.innerText;
				this.handlerInput();
			}
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
				this.reset();
				break;
			case '⌫':
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
		if (!this.conditions.afterInfinity()) {
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
	}

	invertSign() {
		if (!this.conditions.afterInfinity()) {
			if (this.conditions.afterEqual()) {
				this.historyInputFiltered.length = 0;
				this.historyInputFiltered.unshift(String(this.result * -1));
			} else if (this.isNumber(this.lastInput)) this.lastInput = String(this.lastInput * -1);
			this.result = NaN;
		}
	}

	setBracket() {
		if (this.conditions.afterEqual()) {
			if (this.conditions.afterInfinity()) {
				this.result = NaN;
				this.resultDisplay = '0';
			}
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
			if (!this.isNumber(this.lastInput)) this.historyInputFiltered.unshift(this.resultDisplay);
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
		if (this.conditions.equalAgain()) {
			const lastOperand = this.historyInputFiltered.find(item => this.isNumber(item));
			const lastOperator = this.historyInputFiltered.find(
				item => !this.isNumber(item) && !this.conditions.isBracket(item)
			);
			this.historyInputFiltered.length = 0;
			if (lastOperator !== undefined) {
				this.historyInputFiltered.unshift(this.result);
				this.historyInputFiltered.unshift(lastOperator);
				this.historyInputFiltered.unshift(lastOperand);
			}
		} else if (this.conditions.equalAfterOperator()) this.historyInputFiltered.unshift(this.resultDisplay);

		if (this.currentInput === '=') this.fillingBrackets();
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
			if (this.conditions.afterEqual() || this.conditions.afterCloseBrackets()) {
				this.historyInputFiltered.length = 0;
			}
			if (this.conditions.fillingOperand()) {
				if (this.inputDot()) return;
				this.lastInput = this.lastInput + this.currentInput;
			} else this.historyInputFiltered.unshift(this.currentInput);
			this.result = NaN;
			this.debagInfo('operand');
		}
	}
	inputDot() {
		if (this.conditions.isDot(this.currentInput)) {
			if (!this.isNumber(this.lastInput)) {
				this.historyInputFiltered.unshift('0' + this.currentInput);
				return true;
			} else if (~this.lastInput.indexOf('.')) return true;
		}
		return false;
	}

	inputOperator() {
		if (this.conditions.isOperator() && !this.conditions.afterInfinity()) {
			if (this.conditions.afterEqual()) {
				this.historyInputFiltered.length = 0;
				this.historyInputFiltered.unshift(this.result);
			}
			if (this.conditions.atStart()) {
				this.historyInputFiltered.unshift(this.resultDisplay);
				this.historyInputFiltered.unshift(this.currentInput);
			}
			if (this.conditions.afterOpenBracket()) {
				this.historyInputFiltered.unshift(this.resultDisplay);
			}
			if (this.conditions.operatorAgain()) {
				this.lastInput = this.currentInput;
			}
			if (this.conditions.operatorsChain()) {
				this.getResult();
			}
			if (this.conditions.operatorAfterOperand()) {
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
					const regExpNumber = '([-+]?[0-9]+[.,]?([0-9]+(?:[eE][-+]?[0-9]+)?)?|Infinity)';
					let patternExpression = `${regExpNumber} \\` + item + ` ${regExpNumber}`;
					console.log(inputExpression);
					let innerExpression = inputExpression.match(patternExpression)[0];
					console.log(innerExpression);
					let partsInnerExpression = innerExpression.trim().split(' ');
					console.log(partsInnerExpression);
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

	isNumber(value) {
		return !isNaN(parseFloat(value)) && !isNaN(value - 0);
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
