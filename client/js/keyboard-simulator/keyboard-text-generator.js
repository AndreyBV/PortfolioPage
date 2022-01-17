import { rnd } from '../plugins/tools.js';

class TextGenerator {
	constructor(
		arrayTexts = [
			{
				text: 'Чаще сходятся гора с горой, чем человек с человеком.',
				author: 'Станислав Ежи Лец',
				book: 'Непричёсанные мысли',
			},
			{
				text: 'Нет такого общества, с которым не надо было бы расставаться, иногда его приходится даже менять на неприятное.',
				author: 'Александр Дюма',
				book: 'Граф Монте-Кристо',
			},
			{
				text: 'Одиночество либо ожесточает, либо учит независимости.',
				author: 'Джон Фаулз',
				book: 'Любовница французского лейтенанта',
			},
			{
				text: 'Твой труд был бесплоден.',
				author: 'Михаил Салтыков-Щедрин',
				book: 'Приключение с Крамольниковым',
			},
			{
				text: 'Профессионал - это тот же дилетант, но уже знающий, где он ошибется.',
				author: 'Наталья Косухина',
				book: 'Другой мир. Хорошо там, где нас нет',
			},
			{
				text: 'Тревога не лучше страха.',
				author: 'Эрнест Хемингуэй',
				book: 'По ком звонит колокол',
			},
			{
				text: 'Любая книга, рассказывающая о чужой - а не о моей собственной жизни, казалась мне интересной.',
				author: 'Феликс Пальма',
				book: 'Карта времени',
			},
			{
				text: 'Этот мир не хороший и не плохой.',
				author: 'Роман Хорошев',
				book: 'Эволюционизм',
			},
			{
				text: 'Любовь, бывает, не выдерживает даже недолгой разлуки.',
				author: 'Эльчин Сафарли',
				book: 'Мне тебя обещали',
			},
			{
				text: 'Он считает меня своим трофеем, своим секретным оружием.',
				author: 'Тахира Мафи',
				book: 'Разрушь меня',
			},
			{
				text: 'Реки текут по тем руслам, по которым им удобнее течь.',
				author: 'Кирилл Анкудинов',
				book: 'Степень разрешения',
			},
			{
				text: 'Высшая истина существует внутри всех живых существ и вне их, движущихся и неподвижных.',
				author: 'Бхагавад-Гита',
				book: 'Бхагавад-Гита',
			},
			{
				text: 'Вы думаете, что прошлое, которое позади, уже нечто законченное и неизменное.',
				author: 'Милан Кундера',
				book: 'Жизнь не здесь',
			},
			{
				text: 'После ремонта биться головой о стены – не по-хозяйски.',
				author: 'Геннадий Ефимович Малкин',
				book: 'Мысль нельзя придумать',
			},
			{
				text: 'Приготовления к важному событию длятся обыкновенно куда дольше, чем оно само.',
				author: 'Клайв Стейплз Льюис',
				book: 'Пока мы лиц не обрели',
			},
		]
	) {
		this.currentDataText = null;
		this.isServerWork = false;
		this.arrayTexts = arrayTexts;
	}

	generate(maxSuggestions = 1) {
		const numberTexts = this.arrayTexts.length;
		if (this.arrayTexts.length > 15) {
			const indexRandomText = rnd(0, numberTexts - 1);
			this.currentDataText = this.arrayTexts.splice(indexRandomText, 1)[0];
		} else this.currentDataText = this.arrayTexts[rnd(0, numberTexts - 1)];
		if (!this.isServerWork) this._textRequest(maxSuggestions);
		return this.currentDataText;
	}
	repeat() {
		return this.currentDataText;
	}

	_textRequest(maxSuggestions) {
		try {
			this.isServerWork = true;
			const requestURL = 'http://127.0.0.1:3000';
			let url = new URL(requestURL);
			url.searchParams.set('type', 'dataText');

			fetch(url, { method: 'GET' })
				.then(response => response.json())
				.then(json => {
					this.arrayTexts.push(json);
					if (this.arrayTexts.length < 30) this._textRequest(maxSuggestions);
					else this.isServerWork = false;
				})
				.catch(error => {
					console.log(error);
				});
		} catch (error) {
			console.log(error);
		}
	}
}

export default TextGenerator;
