angular.module('csvMerger')
.service('csvService', function($rootScope,  _) {

  var defaults = { results : [], registrations : [], columns : {column1 : null, column2 : null} };
  this.defaults = defaults;

  this.results = defaults.results;
  this.registrations = defaults.registrations;
  this.columns = defaults.columns;

  this.init = (values) => {
    this.results = values.results || this.results;
    this.registrations = values.registrations || this.registrations;
    this.columns = values.columns || this.columns;
  };

  this.merge = () => {

    var columns = this.columns;
    var results = this.results.slice(1).map(r => ({ grade : r[columns.col2], data : r }));
    var resultsMap = _.keyBy(results, (o) => o.data[columns.col1]);
    var studGrade = (s) => s ? [s.grade, null] : [null, 'x'];
    var registrations = this.registrations.map(f => [...f.slice(0,2), ...f.slice(2).map(s => [...s.slice(0,5), ...studGrade(resultsMap[s[1]])]) ]);

    return { results : resultsMap, registrations : registrations };
  };

  this.stats = () => {

    var {results, registrations} = this.merge();

    var elements = _.chain(registrations)
                    .map(r => r.slice(2))
                    .flatten()
                    .map(r => ({ matrnr : r[1], grade : r[5] }) )
                    .value();

    var partByGrade = _.partition(elements, r => r.grade && r.grade !== 'x');
    var partByRegistration = _.partition(_.keys(results), r => _.map(elements, e => e.matrnr).indexOf(r) > -1);

    var numberCount = () => _.extend({}, _.fill(new Array(10), 0));
    var sign = (m) => _.values(_.extend(numberCount(), _.countBy(m))).join('');

    // Signs all registered students which have no result
    var regStudsWithoutResult = _.chain(registrations)
             .flatten()
             .filter(r => r[6] === 'x')
             .map(r => ({ sign : sign(r[1]), matrnr : r[1] }))
             .value();


    var signMap = _.reduce(regStudsWithoutResult, (o, c) => {
      if(!o[c.sign]) o[c.sign] = [c.matrnr];
      else o[c.sign].push[c.matrnr];
      return o;
    }, {});

    var matrnrs = _.map(regStudsWithoutResult, 'matrnr');

    function diffChars(a,b, limit = 1) {
      for(let i=0;i<a.length && limit >= 0;i++)
        limit -= a.charAt(i) === b.charAt(i) ? 0 : 1;
      return limit;
    }

    var warnings = partByRegistration[1].map(mnr => {
      var w = {};
      w.data = results[mnr].data;
      w.similar = matrnrs.filter((m) => diffChars(mnr,m) > -1);
      var switcher = (signMap[sign(mnr)] || []).filter(m => diffChars(mnr, m, 2) > -1);
      w.similar = _.compact(w.similar.concat(switcher));
      w.selected = 1;
      return w;
    });

    var stats = { registrations : registrations, results : results, warnings : warnings, columns : this.columns };
    return stats;

  };

})
