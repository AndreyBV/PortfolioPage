import Stopwatch from '../plugins/stopwatch.js';

// Формулы расчета статистических данных:
// https://klavogonki.ru/wiki/Скорость
// https://klavogonki.ru/wiki/Точность
// https://klavogonki.ru/wiki/Ритмичность

class KeyboardStatistic {
	constructor(DOMElements, textGenerator, stopwatch = new Stopwatch()) {
		this.DOM = DOMElements;

		this.statistics = new Map();
		this.statisticsBySeconds = null;

		this.textGenerator = textGenerator;
		this.stopwatch = stopwatch;
		this.chart = null;

		this._counterWord = 0;
		this.initial();
	}

	set counterWord(value) {
		this._counterWord = value;
		if (
			this.DOM.liveCounterWordBlock.element !== null &&
			this.DOM.liveCounterWordBlock.element.innerText !== null
		)
			this.DOM.liveCounterWordBlock.element.innerText = this._counterWord;
	}
	get counterWord() {
		return this._counterWord;
	}

	get counterSymbol() {
		const counter = {
			correct: 0,
			incorrect: 0,
			extra: 0,
			missed: 0,
			incorrectFixed: 0,
			extraFixed: 0,
			missedFixed: 0,
			space: 0,

			[Symbol.toPrimitive](hint) {
				return hint === 'string'
					? `${this.correct + this.space}/${this.incorrect - this.incorrectFixed}/${
							this.extra - this.extraFixed
					  }/${this.missed - this.missedFixed}`
					: null;
			},
		};

		const arrayStatistic = Array.from(this.statistics.values());
		for (let statistic of arrayStatistic) {
			const arrayEnters = Array.from(statistic.timeArray.values());
			for (let itemStatistic of arrayEnters) {
				if (itemStatistic.isFixed === undefined || itemStatistic.isFixed === false)
					counter[itemStatistic.typeSymbol] += 1;
				else if (itemStatistic.isFixed === true) counter[itemStatistic.typeSymbol + 'Fixed'] += 1;
			}
		}
		return counter;
	}

	get currentCpm() {
		const time = this.stopwatch.getTime('milliseconds');
		if (time != 0)
			return Math.floor((this.counterSymbol.correct + this.counterSymbol.space) / (+time / 1000 / 60));
		else return 0;
	}

	initial() {
		this.DOM.liveCounterWordBlock.element.innerText = 0;
		this.DOM.liveCpmBlock.element.innerText = 0;
		this.DOM.liveTimeBlock.element.innerText = '00s';
	}
	debugInfo(title = 'DEBAG STATISTICS') {
		console.log(title);
		console.log(this);
	}

	isRun() {
		return this.stopwatch.isRun;
	}
	onGetStatistic() {
		this.stopwatch.start(
			{ func: this.updateLiveCpm.bind(this), numberDelays: 50 },
			{ func: this.updateLiveTime.bind(this), numberDelays: 50 }
		);
	}
	pauseGetStatistic() {
		this.stopwatch.pause();
	}
	offGetStatistic() {
		this.stopwatch.stop();
		this.statisticsBySeconds = this.aggregateBySeconds();
	}
	updateLiveCpm() {
		this.DOM.liveCpmBlock.element.innerText = this.currentCpm;
	}
	updateLiveTime(milliseconds) {
		this.DOM.liveTimeBlock.element.innerText = this.stopwatch.toString();
	}

	showLiveCounterWord(isShow) {
		if (
			this.DOM.liveCounterWordBlock.element !== null &&
			this.DOM.liveCounterWordBlock.element.innerText !== null
		) {
			if (isShow === false) this.DOM.liveCounterWordBlock.element.style.display = 'none';
			else this.DOM.liveCounterWordBlock.element.style.display = 'block';
		}
	}
	showLiveCpm(isShow = true) {
		if (this.DOM.liveCpmBlock.element !== null && this.DOM.liveCpmBlock.element.innerText !== null) {
			if (isShow === false) this.DOM.liveCpmBlock.element.style.display = 'none';
			else this.DOM.liveCpmBlock.element.style.display = 'block';
		}
	}

	// обновление статистических данных
	update(symbol, typeSymbol, word, isFixed = undefined, time = this.stopwatch.getTime('milliseconds')) {
		// Структура данных
		// Map ([
		// 	symbol: {
		// 	word: word,
		// 	timeArray: Map ([
		// 		time: {
		// 			typeSymbol: typeSymbol,
		// 			isFixed: isFixed,
		// 			cpm: this.currentCpm,
		// 		}
		// 	])
		// }])
		if (typeSymbol == 'space') this.counterWord += 1;
		if (typeSymbol == 'backspaceWord') this.counterWord -= 1;

		const itemStatistic = {
			typeSymbol: typeSymbol,
			isFixed: isFixed,
			cpm: this.currentCpm,
		};
		if (this.statistics.has(symbol)) {
			const elemStat = this.statistics.get(symbol);
			elemStat.timeArray.set(time, itemStatistic);
		} else {
			const timeArray = new Map([[time, itemStatistic]]);
			this.statistics.set(symbol, { word: word, timeArray: timeArray });
		}
	}
	// Группировка статистических данных по секундам
	groupBySeconds() {
		// Структура данных
		// {second: [{
		// 	symbol: symbol,
		// 	typeSymbol: typeSymbol,
		// 	isFixed: isFixed,
		// 	cpm: cpm,
		// 	word: word,
		// }]}

		const groupData = {};
		this.statistics.forEach((statistic, symbol) => {
			statistic.timeArray.forEach((itemStatistic, time) => {
				let second = Math.trunc(time / 1000);
				let itemSymbol = {
					symbol: symbol,
					typeSymbol: itemStatistic.typeSymbol,
					isFixed: itemStatistic.isFixed,
					cpm: itemStatistic.cpm,
					word: statistic.word,
				};

				if (second in groupData) groupData[second].push(itemSymbol);
				else groupData[second] = [itemSymbol];
			});
		});
		return groupData;
	}
	// Сжатие данных по ключу
	collapseByKey(arrayObj, key, funcCollapse = value => value, initialValue = 0) {
		return arrayObj.reduce((acc, obj) => funcCollapse(acc, obj, key), initialValue);
	}

	// Агрегирование статистики по секундам
	aggregateBySeconds() {
		const statisticGroup = this.groupBySeconds();

		const aggregateData = new Map();
		for (let second in statisticGroup) {
			// console.log(second + ' -----------------------------');
			let itemsSecond = statisticGroup[second];

			function counterTypeSymbol(type, isFixed = undefined) {
				return this.collapseByKey(
					itemsSecond,
					'typeSymbol',
					(acc, obj, key) => acc + (obj[key] == type && obj['isFixed'] === isFixed ? 1 : 0)
				);
			}
			function averageCpm() {
				return parseInt(
					this.collapseByKey(itemsSecond, 'cpm', (acc, obj, key) => acc + obj[key]) / itemsSecond.length
				);
			}
			function symbolsSecond() {
				return this.collapseByKey(
					itemsSecond,
					'symbol',
					(acc, obj, key) => {
						acc.push(obj[key]);
						return acc;
					},
					[]
				);
			}

			let rebaseItem = {
				avgCpm: averageCpm.call(this),
				correct: counterTypeSymbol.call(this, 'correct'),
				incorrect: counterTypeSymbol.call(this, 'incorrect', false),
				extra: counterTypeSymbol.call(this, 'extra', false),
				missed: counterTypeSymbol.call(this, 'missed', false),
				incorrectFixed: counterTypeSymbol.call(this, 'incorrect', true),
				extraFixed: counterTypeSymbol.call(this, 'extra', true),
				missedFixed: counterTypeSymbol.call(this, 'missed', true),
				space: counterTypeSymbol.call(this, 'space'),
				symbols: symbolsSecond.call(this),
			};

			aggregateData.set(second, rebaseItem);
		}
		return aggregateData;
	}

	// Получение статистических данных для отображения
	getStatistics() {
		const valuesStat = Array.from(this.statisticsBySeconds.values());
		console.log(this.statisticsBySeconds);
		const cpm = parseInt(
			this.collapseByKey(
				valuesStat,
				'avgCpm',
				(acc, obj, key) => {
					return acc + obj[key];
				},
				0
			) / valuesStat.length
		);

		const accuracyRatio = this.collapseByKey(
			valuesStat,
			'correct',
			(acc, obj, key) => {
				const numberCorrect = acc.correct + obj[key];
				const numberError = acc.error + obj['incorrect'] + obj['extra'] + obj['missed'];
				return {
					correct: !isNaN(numberCorrect) ? numberCorrect : 0,
					error: !isNaN(numberError) ? numberError : 0,
				};
			},
			{ correct: 0, error: 0 }
		);

		let accuracy = Math.floor(100 - (accuracyRatio.error / accuracyRatio.correct) * 100);
		accuracy = accuracy < 0 ? 0 : accuracy;

		const characters = String(this.counterSymbol);

		const allTime = this.stopwatch.toString();
		console.log(this.textGenerator.currentDataText);
		const resultStatistics = {
			cpm: cpm,
			accuracy: accuracy + '%',
			characters: characters,
			allTime: allTime,
			source:
				'"' + this.textGenerator.currentDataText.book + '" - ' + this.textGenerator.currentDataText.author,
		};

		console.log(this.statistics);
		console.log(resultStatistics);

		this.DOM.cpmBlock.element.innerText = resultStatistics.cpm;
		this.DOM.accuracyBlock.element.innerText = resultStatistics.accuracy;
		this.DOM.charactersBlock.element.innerText = resultStatistics.characters;
		this.DOM.timeBlock.element.innerText = resultStatistics.allTime;
		this.DOM.sourceBlock.element.innerText = resultStatistics.source;
		return resultStatistics;
	}

	reset() {
		this.offGetStatistic();

		this.statistics = new Map();
		this.statisticsBySeconds = null;

		this.stopwatch = new Stopwatch();
		this._counterWord = 0;
		if (this.chart !== null) this.chart.destroy();
		this.chart = null;

		this.initial();
	}

	showChart() {
		const RED_COLOR = '#ec4c56';
		const WHITE_COLOR = '#f6f0e9';
		const BASE_COLOR = '#596172';

		const xAxisData = Array.from(this.statisticsBySeconds.keys());
		const cpmAxisData = Array.from(this.statisticsBySeconds.values(), obj => obj.avgCpm);
		const errorAxisData = Array.from(this.statisticsBySeconds.values(), obj =>
			obj.incorrect != 0 ? obj.incorrect : null
		);
		const extraAxisData = Array.from(this.statisticsBySeconds.values(), obj =>
			obj.extra != 0 ? obj.extra : null
		);
		const missedAxisData = Array.from(this.statisticsBySeconds.values(), obj =>
			obj.missed != 0 ? obj.missed : null
		);

		const chartData = {
			labels: xAxisData,
			datasets: [
				{
					data: cpmAxisData,
					type: 'line',
					label: 'cpm',
					order: 4,
					yAxisID: 'yAxis',
					borderWidth: 1,
					tension: 0.3,

					borderColor: WHITE_COLOR,
					fill: true,
				},
				{
					data: errorAxisData,
					type: 'scatter',
					label: 'Опечатки',
					order: 1,
					yAxisID: 'errorAxis',
					borderWidth: 2,
					pointStyle: 'crossRot',
					borderColor: RED_COLOR,
					fill: false,
				},
				{
					data: extraAxisData,
					type: 'scatter',
					label: 'Лишние',
					order: 2,
					yAxisID: 'errorAxis',
					borderWidth: 1,
					pointStyle: 'triangle',
					borderColor: RED_COLOR,
					fill: false,
				},
				{
					data: missedAxisData,
					type: 'scatter',
					label: 'Пропущенные',
					order: 3,
					yAxisID: 'errorAxis',
					borderWidth: 1,
					pointStyle: 'circle',

					borderColor: RED_COLOR,
					fill: false,
				},
			],
		};
		const chartOptions = {
			scales: {
				xAxis: {
					title: {
						display: false,
						text: 'Seconds',
					},
				},

				yAxis: {
					display: true,
					min: 0,
					title: {
						display: true,
						text: 'Символов в минуту (cpm)',
					},
					ticks: {
						precision: 0,
						stepSize: 100,
					},
				},
				errorAxis: {
					display: true,
					min: 0,
					position: 'right',
					title: {
						display: true,
						text: 'Ошибки',
					},
					ticks: {
						precision: 0,
					},
					grid: {
						display: false,
					},
				},
			},
			plugins: {
				title: {
					display: false,
					text: 'Статистика по набранному тексту',
					padding: {
						top: 5,
						bottom: 5,
					},
				},
				legend: {
					display: false,
					labels: {},
				},
				tooltip: {
					usePointStyle: true,
					titleColor: RED_COLOR,
					mode: 'index',
					position: 'average',
					itemSort: (firstEl, secondEl) => {
						if (firstEl.dataset.label === 'cpm') {
							var labelA = firstEl.dataset.label.toUpperCase();
							var labelB = secondEl.dataset.label.toUpperCase();
							if (labelA < labelB) return -1;
							if (labelA > labelB) return 1;
							return 0;
						}
					},
					callbacks: {
						title: items => {
							// console.log(items);
							let resultTitle = '';
							items.forEach(item => {
								resultTitle = item.parsed.x + '-ая секунда';
							});
							return resultTitle;
						},
						footer: items => {
							let sumError = 0;
							items.forEach(item => {
								if (item.dataset.label !== 'cpm') sumError += item.parsed.y;
							});
							if (sumError === 0) return;
							return 'Всего ошибок: ' + sumError;
						},
					},
				},
			},
			responsive: true,
			maintainAspectRatio: true,
		};

		Chart.defaults.font.size = 12;
		Chart.defaults.font.family = "'Roboto Mono', sans-serif";
		Chart.defaults.color = BASE_COLOR;
		this.chart = new Chart(this.DOM.canvasBlock.element.getContext('2d'), {
			data: chartData,
			options: chartOptions,
		});
	}
	chartDestroy() {
		this.chart.destroy();
	}
}

export default KeyboardStatistic;
