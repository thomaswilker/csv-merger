const fs = require('fs');
const parse = require('csv-parse');
const det = require('detect-csv');
const encoding = require('encoding');
const utf8 = require('to-utf-8');
const transform = require('stream-transform');

// const transformer = transform(function(record, callback){
//   setTimeout(function(){
//     callback(null, record.join(' ')+'\n');
//   }, 500);
// }, {parallel: 10});
//
//
// fs.createReadStream("./data/input/klaus.csv")
// 		.pipe(utf8())
// 		.pipe(parse({ delimiter : ';'}))
// 		.pipe(transformer)
// 		.pipe(process.stdout)


var content = fs.readFileSync('./data/input/tucan.txt');
content = encoding.convert(content, 'utf8', 'windows1252');
var csv = parse(content, { delimiter : '\t'}, function(err, data) {
	console.log(data);
});


var content = fs.readFile('./data/input/tucan.txt'), function(err, content) {
	content = encoding.convert(content, 'utf8', 'windows1252');
	var csv = parse(content, { delimiter : '\t'}, function(err, data) {
		console.log(data);
	});
});
