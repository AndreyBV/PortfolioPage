import TextGenerator from './keyboard-text-generator.js';
import { getDOMElements } from '../_plugin/getter-dom-elements.js';
import { rnd } from '../_plugin/tools.js';

class KeyboardSimulator {
	constructor(DOMElements, textGenerator = new TextGenerator()) {
		this.DOM = DOMElements;
		this.textGenerator = textGenerator;

		this._currentWord = null;
		this._previousWord = null;
		this._nextWord = null;
		this._symbolsWord = null;
		this._currentSymbol = null;
		this._previousSymbol = null;
		this._nextSymbol = null;

		this.initial();
	}

	get currentSymbol() {
		return this._currentSymbol;
	}
	set currentSymbol(symbol) {
		this._currentSymbol = symbol;

		if (this._currentSymbol == null && this.previousSymbol != null) {
			const [caretPositionX, caretPositionY] = this.getCoordinatesSymbol(this.previousSymbol, true);
			this.changeCaretPosition(caretPositionX, caretPositionY);
		} // для конца слов
		else if (this._currentSymbol != null && this.checkTypeSymbol(this.currentSymbol, 'extra')) {
			const [caretPositionX, caretPositionY] = this.getCoordinatesSymbol(this.currentSymbol, true);
			this.changeCaretPosition(caretPositionX, caretPositionY);
		} // лишние символы
		else if (this._currentSymbol != null) {
			const [caretPositionX, caretPositionY] = this.getCoordinatesSymbol();
			this.changeCaretPosition(caretPositionX, caretPositionY);
		} // по дефолту
	}

	get currentWord() {
		return this._currentWord;
	}
	set currentWord(value) {
		this.resetWordStyle(this._currentWord);
		this._currentWord = value;

		if (this._currentWord != null) {
			this._symbolsWord = this._currentWord.getElementsByClassName(this.DOM.symbolBlock.class);
			this.resetWordStyle();
			this.setModifier(this._currentWord, this.DOM.wordBlock.class, 'active');

			const [caretPositionX, caretPositionY] = this.getCoordinatesWord();
			this.changeCaretPosition(caretPositionX, caretPositionY);
		} else this._symbolsWord = null;
	}

	get symbolsWord() {
		return this._symbolsWord;
	}
	set symbolsWord(value) {
		this._symbolsWord = value;
	}

	get previousSymbol() {
		if (
			this.currentSymbol == null &&
			this._previousSymbol != null &&
			this._previousSymbol.nextElementSibling != null
		) {
			this._previousSymbol = this._previousSymbol.nextElementSibling;
		} else if (this.currentSymbol == null && this.symbolsWord != null && this.symbolsWord.length == 1) {
			this._previousSymbol = this.symbolsWord[this.symbolsWord.length - 1];
		} else if (this.currentSymbol == null && this._previousSymbol == null) {
			this._previousSymbol = null;
		} else if (this.currentSymbol != null) this._previousSymbol = this.currentSymbol.previousElementSibling;
		return this._previousSymbol;
	}
	set previousSymbol(value) {
		this._previousSymbol = value;
	}
	get nextSymbol() {
		if (this.currentSymbol == null) this._nextSymbol == null;
		else if (this.currentSymbol != null) this._nextSymbol = this.currentSymbol.nextElementSibling;
		return this._nextSymbol;
	}
	set nextSymbol(value) {
		this._nextSymbol = value;
	}

	get previousWord() {
		if (this.currentWord == null) this._previousWord == null;
		else this._previousWord = this.currentWord.previousElementSibling;
		return this._previousWord;
	}
	set previousWord(value) {
		this._previousWord = value;
	}
	get nextWord() {
		if (this.currentWord == null) this._nextWord == null;
		else this._nextWord = this.currentWord.nextElementSibling;
		return this._nextWord;
	}
	set nextWord(value) {
		this._nextWord = value;
	}

	initial() {
		this.DOM.bodyKeyboardSimulator.element.addEventListener('click', this);
		this.DOM.bodyKeyboardSimulator.element.addEventListener('keydown', this);

		const generatedText = this.textGenerator.generate();
		this.showText(generatedText);

		this.initialCaretPosition();
	}

	handleEvent(event) {
		let method = 'on' + event.type[0].toUpperCase() + event.type.slice(1);
		this[method](event);
	}
	onKeydown(event) {
		this.inputSymbol(event);
	}
	onClick(event) {
		const target = event.target;
		if (!!target.closest('.' + this.DOM.nextText.class)) {
			const generatedText = this.textGenerator.generate();
			this.updateText(generatedText);
		} // получение нового текста
		else if (!!target.closest('.' + this.DOM.nextTextStatistic.class)) {
			this.DOM.keyboardTrainerBlock.element.classList.toggle('none');
			this.DOM.keyboardStatisticsBlock.element.classList.toggle('none');
			const generatedText = this.textGenerator.generate();
			this.updateText(generatedText);
		} // получение нового текста
		else if (!!target.closest('.' + this.DOM.repeatTextStatistic.class)) {
			this.DOM.keyboardTrainerBlock.element.classList.toggle('none');
			this.DOM.keyboardStatisticsBlock.element.classList.toggle('none');
			const generatedText = this.textGenerator.repeat();
			this.updateText(generatedText);
		} // повторный ввод текста
	}

	updateText(dataText) {
		this.reset();
		this.showText(dataText);
		this.initialCaretPosition();
		this.DOM.keyboardTrainerBlock.element.focus();
	}
	reset() {
		this.currentWord = null;
		this.previousWord = null;
		this.nextWord = null;
		this.symbolsWord = null;
		this.currentSymbol = null;
		this.previousSymbol = null;
		this.nextSymbol = null;
	}

	debugInfo(title = 'DEBAG KEYBOARD') {
		console.log('---------- ' + title);
		console.log(this);
	}

	inputSymbol(symbol) {
		if (symbol.ctrlKey && symbol.key == 'Backspace') {
			this.hardBackspace();
			this.playSoundClick();
			return;
		} // нажат бекспейс
		else if (symbol.key == 'Backspace') {
			this.softBackspace();
			this.playSoundClick();
			return;
		} // нажат бекспейс
		else if (symbol.key == ' ') {
			symbol.preventDefault();
			this.space();
			this.playSoundClick();
			return;
		} // нажат пробел

		if (this.isValidSymbol(symbol)) {
			this.initialEnter();
			if (this.currentSymbol != null && !this.checkTypeSymbol(this.currentSymbol, 'extra')) {
				if (symbol.key == this.currentSymbol.innerText) {
					this.setModifier(this.currentSymbol, this.DOM.symbolBlock.class, 'correct', 'toggle');
					this.goNextSymbol();
				} // корректные символы
				else {
					this.setModifier(this.currentSymbol, this.DOM.symbolBlock.class, 'incorrect', 'toggle');
					this.goNextSymbol();
				} // некорректные символы
			} else if (this.isMaxExtraSymbols()) {
				const extraSymbol = this.addSymbolInWord(this.currentWord, symbol.key, 'extra');
				this.currentSymbol = extraSymbol;
			} // лишние символы
			this.playSoundClick();
		}
	}
	initialEnter() {
		if (this.previousWord == null && this.currentWord == null) {
			this.currentWord = this.DOM.wordsBlock.element.querySelector('.' + this.DOM.wordBlock.class);
			this.currentSymbol = this.currentWord.querySelector('.' + this.DOM.symbolBlock.class);
		}
	}
	isValidSymbol(symbol) {
		Number.prototype.between = function (min, max) {
			return this >= min && this <= max;
		};
		if (
			symbol.keyCode.between(48, 57) || // цифры
			symbol.keyCode.between(65, 90) || // буквы
			symbol.keyCode.between(186, 192) || // символы
			symbol.keyCode.between(219, 222) ||
			symbol.keyCode.between(96, 105)
		)
			return true;
		return false;
	}
	isMaxExtraSymbols(maxExtraSymbols = 5) {
		const currentNumberExtraSymbol = this.currentWord.getElementsByClassName(
			this.DOM.symbolBlock.class + '_extra'
		).length;

		if (currentNumberExtraSymbol >= maxExtraSymbols) return false;
		return true;
	}
	addSymbolInWord(word = this.currentWord, symbol = '', modifier = '') {
		let symbolElement = document.createElement('span');
		// this.setSymbolModifier(symbolElement);
		this.setModifier(symbolElement, this.DOM.symbolBlock.class);
		if (modifier == 'extra') this.setModifier(symbolElement, this.DOM.symbolBlock.class, 'extra');
		else if (modifier == 'correct') this.setModifier(symbolElement, this.DOM.symbolBlock.class, 'correct');
		else if (modifier == 'incorrect')
			this.setModifier(symbolElement, this.DOM.symbolBlock.class, 'incorrect');
		symbolElement.innerText = symbol;
		return word.appendChild(symbolElement);
	}

	checkTypeSymbol(symbol = this.currentSymbol, type = '') {
		return symbol.classList.contains(this.DOM.symbolBlock.class + '_' + type);
	}

	goNextWord() {
		if (this.nextWord != null) {
			this.currentWord = this.nextWord;
			this.setMistakeWord(this.previousWord);
		}
	}
	goNextSymbol() {
		if (this.nextSymbol != null) {
			this.currentSymbol = this.nextSymbol;
		} else {
			this.currentSymbol = null;
		}
	}
	goPreviousWord() {
		if (this.previousWord != null) {
			this.currentWord = this.previousWord;
		}
	}
	goPreviousSymbol() {
		if (this.previousSymbol != null) {
			if (this.currentSymbol != null && this.checkTypeSymbol(this.currentSymbol, 'extra')) {
				this.currentSymbol = this.previousSymbol;
				this.currentWord.removeChild(this.nextSymbol);
				if (!this.checkTypeSymbol(this.currentSymbol, 'extra')) {
					this.goNextSymbol();
				}
			} else {
				this.currentSymbol = this.previousSymbol;
				this.resetSymbolStyle();
			}
		}
	}

	setMistakeWord(word = this.currentWord) {
		// проверка на некорректные символы
		let incorrectSymbol = word.querySelector('.' + this.DOM.symbolBlock.class + '_incorrect');
		// проверка на пропущенные символы
		let missedSymbols = this.getMissedSymbols(word);
		for (let symbol of missedSymbols) {
			this.setModifier(symbol, this.DOM.symbolBlock.class, 'missed');
		}
		// Проверка на лишние символы
		let extraSymbol = word.querySelector('.' + this.DOM.symbolBlock.class + '_extra');

		if (incorrectSymbol != null || missedSymbols != 0 || extraSymbol != null) {
			this.setModifier(word, this.DOM.wordBlock.class, 'error');
			return true;
		}
		return false;
	}

	getMissedSymbols(word = this.currentWord) {
		const symbolsWord = Array.from(word.getElementsByClassName(this.DOM.symbolBlock.class));
		const symbolsCorrect = Array.from(word.getElementsByClassName(this.DOM.symbolBlock.class + '_correct'));
		const symbolsIncorrect = Array.from(
			word.getElementsByClassName(this.DOM.symbolBlock.class + '_incorrect')
		);
		const symbolsExtra = Array.from(word.getElementsByClassName(this.DOM.symbolBlock.class + '_extra'));
		let symbolsMissed = symbolsWord.filter(
			x => !symbolsCorrect.concat(symbolsIncorrect.concat(symbolsExtra)).includes(x)
		);
		return symbolsMissed;
	}

	getCoordinatesWord(word = this.currentWord) {
		const x = word.offsetLeft;
		const y = word.offsetTop;
		return [x, y];
	}
	getCoordinatesSymbol(symbol = this.currentSymbol, endWord = false) {
		let x = NaN;
		let y = NaN;
		if (symbol == null) {
			[x, y] = this.getCoordinatesWord();
			return [x, y];
		} else if (this.currentSymbol == this.previousSymbol || endWord) {
			x = symbol.offsetLeft + symbol.offsetWidth;
		} else x = symbol.offsetLeft;
		y = symbol.offsetTop;
		return [x, y];
	}
	resetWordStyle(words = this.currentWord) {
		if (words != null) {
			words = this.convertArray(words);
			for (let word of words) {
				word.classList = '';
				this.setModifier(word, this.DOM.wordBlock.class);
			}
		}
	}
	resetSymbolStyle(symbols = this.currentSymbol) {
		if (symbols != null) {
			symbols = this.convertArray(symbols);
			for (let symbol of symbols) {
				symbol.classList = '';
				this.setModifier(symbol, this.DOM.symbolBlock.class);
			}
		}
	}
	convertArray(data) {
		return Array.from(Array(data), () => {
			return data;
		});
	}
	setModifier(objectDOM, className = '', modifier = '', action = 'add') {
		if (modifier != '') modifier = '_' + modifier;
		className = className + modifier;

		if (action == 'add') objectDOM.classList.add(className);
		else if (action == 'remove') objectDOM.classList.remove(className);
		else if (action == 'toggle') objectDOM.classList.toggle(className);
	}

	hardBackspace() {
		if (this.previousSymbol != null) {
			while (this.previousSymbol != null) {
				this.softBackspace();
			}
		} else if (this.previousWord != null) {
			this.currentWord = this.previousWord;
			this.currentSymbol = this.symbolsWord[this.symbolsWord.length - 1];
			if (!this.checkTypeSymbol(this.currentSymbol, 'extra')) this.goNextSymbol();
			while (this.previousSymbol != null) {
				this.softBackspace();
			}
		}
	}
	softBackspace() {
		if (this.previousSymbol == null && this.previousWord != null) {
			this.goPreviousWord();
			let missedSymbols = this.currentWord.querySelectorAll('.' + this.DOM.symbolBlock.class + '_missed');

			if (missedSymbols.length == 0) {
				this.currentSymbol = this.symbolsWord[this.symbolsWord.length - 1];
				if (!this.checkTypeSymbol(this.currentSymbol, 'extra')) this.goNextSymbol();
			} else {
				this.currentSymbol = missedSymbols[0];

				for (let symbol of missedSymbols) {
					this.setModifier(symbol, this.DOM.symbolBlock.class, 'missed', 'remove');
				}
			}
			return;
		} else if (this.previousSymbol != null) {
			this.goPreviousSymbol();
		}
	}

	space() {
		if (this.previousSymbol != null && this.nextWord != null) {
			this.goNextWord();
			this.currentSymbol = this.symbolsWord[0];
		} else if (this.currentWord != null && this.nextWord == null) {
			this.endEnter();
		}
	}

	endEnter() {
		this.DOM.keyboardTrainerBlock.element.classList.toggle('none');
		this.DOM.keyboardStatisticsBlock.element.classList.toggle('none');
	}

	initialCaretPosition() {
		const firstWord = this.DOM.wordsBlock.element.querySelector('.' + this.DOM.wordBlock.class);
		const [caretPositionX, caretPositionY] = this.getCoordinatesWord(firstWord);
		this.changeCaretPosition(caretPositionX, caretPositionY);
	}
	changeCaretPosition(x = 0, y = 0) {
		this.DOM.caretBlock.element.style.left = x + 'px';
		this.DOM.caretBlock.element.style.top = y + 'px';
	}
	showText(dataText) {
		const wordsPanel = document.querySelector('.' + this.DOM.wordsBlock.class);
		const totalWordsPanel = document.querySelector('.' + this.DOM.liveAllWord.class);

		const textTraining = dataText.text;
		let wordsText = textTraining.trim().split(' ');
		totalWordsPanel.innerText = wordsText.length;
		let symbolIndex = 0;
		wordsPanel.innerHTML = '';
		for (let word of wordsText) {
			let wordElement = document.createElement('div');
			wordElement.className = this.DOM.wordBlock.class;
			for (let symbol of word) {
				let symbolElement = document.createElement('span');
				symbolElement.className = this.DOM.symbolBlock.class;
				symbolElement.innerText = symbol;
				symbolElement.setAttribute('data-id', symbolIndex++);
				wordElement.appendChild(symbolElement);
			}
			symbolIndex++;
			wordsPanel.appendChild(wordElement);
		}
	}
	playSoundClick() {
		let indexSound = rnd(1, 12);
		let dir = `/portfolio/client/media/sounds/keyboard-press/click5_${indexSound}.wav`;
		const sound = new Audio(dir);
		sound.play();
	}
}

const elementClasses = {
	bodyKeyboardSimulator: 'body-keyboard-simulator',
	keyboardTrainerBlock: 'body-keyboard-simulator__trainer',
	keyboardStatisticsBlock: 'statistic-keyboard-simulator',
	caretBlock: 'body-keyboard-simulator__caret',
	wordsBlock: 'body-keyboard-simulator__words',
	wordBlock: 'body-keyboard-simulator__word',
	symbolBlock: 'body-keyboard-simulator__symbol',

	liveCounterWordBlock: 'live-stat-ks__input-word',
	liveAllWord: 'live-stat-ks__all-word',
	liveCpmBlock: 'live-stat-ks__cpm',
	liveTimeBlock: 'live-stat-ks__time',

	canvasBlock: 'statistic-keyboard-simulator__chart',
	cpmBlock: 'statistic-keyboard-simulator__cpm-value',
	accuracyBlock: 'statistic-keyboard-simulator__accuracy-value',
	charactersBlock: 'statistic-keyboard-simulator__characters-value',
	timeBlock: 'statistic-keyboard-simulator__time-value',
	sourceBlock: 'statistic-keyboard-simulator__source-value',

	nextText: 'body-keyboard-simulator__next-text',
	repeatTextStatistic: 'statistic-keyboard-simulator__repeat-text',
	nextTextStatistic: 'statistic-keyboard-simulator__next-text',
};

const DOMElements = getDOMElements(elementClasses);

const textGenerator = new TextGenerator();
let keyboardSimulator = new KeyboardSimulator(DOMElements, textGenerator);
