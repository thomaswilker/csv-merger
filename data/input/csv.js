var csv = require('csv');
var fs = require('fs');

fs.readFile('tucan.txt', 'utf8', function(err, data) {
    if(!err) {
      csv.parse(data, {delimiter : '\t'}, function(e, d) {
          console.log(d);
      });
    }
});

fs.readFile('klaus.csv', 'utf8', function(err, data) {
    if(!err) {
      csv.parse(data, {delimiter : ';'}, function(e, d) {
          console.log(d);
      });
    }
});
