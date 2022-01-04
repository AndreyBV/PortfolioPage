import axios from 'axios';
import cheerio from 'cheerio';

export async function parserBookQuotes(numberSentences = 1) {
	const getHTML = async url => {
		const { data } = await axios.get(url);
		return cheerio.load(data);
	};

	let page = 1;
	let url = `https://bbf.ru/quotes/?page=${page}&source_kind=1`;
	const startPage = await getHTML(url);
	const pages = startPage('ul.paginator');
	const numberPages = parseInt(pages.children().last().text());
	page = Math.floor(Math.random() * numberPages);
	url = `https://bbf.ru/quotes/?page=${page}&source_kind=1`;

	const rndPage = await getHTML(url);
	const quotes = rndPage('article.sentence');
	const rndNumberQuote = Math.floor(Math.random() * quotes.length);
	const quote = quotes.eq(rndNumberQuote);
	let quoteText = quote.children('.sentence__body').text();
	const quoteSource = quote.children('.sentence__author');
	const quoteAuthor = quoteSource.children('a').eq(0).text();
	const quoteBook = quoteSource.children('a').eq(1).text();

	quoteText = quoteText
		.trim()
		.replaceAll('\n', '')
		.replaceAll('—', '-')
		.replaceAll('«', '"')
		.replaceAll('»', '"');

	quoteText = setLimitSentences(quoteText, numberSentences);
	return {
		text: quoteText,
		author: quoteAuthor.trim(),
		book: quoteBook.trim(),
	};
}

function setLimitSentences(sentences, maxSuggestion) {
	const suggestionsText = sentences.match(/[^\.!\?]+/g);
	let resultSentences = '';
	if (suggestionsText.length > maxSuggestion) {
		while (maxSuggestion) {
			resultSentences += suggestionsText.shift() + '.';
			maxSuggestion--;
		}
	}
	return resultSentences;
}

// const parseData = await parserBookQuotes();
// console.log(parseData);
