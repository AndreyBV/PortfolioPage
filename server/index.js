import express, { response } from 'express';

import { parserBookQuotes } from './keyboard-simulator/book-quotes-parser.js';

const app = express();
const port = 3000;

// Настройка CORS
app.use((request, response, next) => {
	response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	response.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

app.get('/', async (request, response) => {
	const dataRequest = request.query;
	if (dataRequest.type == 'dataText') {
		let parseData = await parserBookQuotes(1);
		response.send(JSON.stringify(parseData));

		console.log('----- Request book quotes');
		console.log(dataRequest);
		console.log(parseData);
	} else response.send(null);
});

app.listen(port, err => {
	if (err) return console.log('error', err);
	console.log(`Порт сервера: ${port}`);
});
