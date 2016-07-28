angular.module('csvMerger')
.service('csvService', function($rootScope, _) {

  this.results = [];
  this.registrations = [];
  this.columns = [];
  
  var fields = {
    results : [],
    registrations : [],
    columns : { col1 : null, col2 : null }
  };

  this.value = (f, v) => {
    if(v) {
      fields[f] = v;
      $rootScope.$broadcast(f, v);
    }
    else return fields[f];
  };

  function merge() {

    var results = fields.results;
    var columns = fields.columns;

    var resultsMap = results.slice(1).reduce((o,c) => {
      if(c && c[columns.col1]) {
        o[c[columns.col1]] = { grade : c[columns.col2], data : c };
      }
      return o;
    }, {});

    var registrations = fields.registrations;

    registrations.forEach((f,index) => f.slice(2).forEach(s => {
      var stud = resultsMap[s[1]];
      if(stud) {
        s[5] =  stud.grade;
        s[6] =  null;
      } else {
        s[5] =  null;
        s[6] = 'x';
      }
    }));

    return { resultsMap : resultsMap, registrations : registrations };
  }

  this.merge = () => merge();

  this.stats = () => {

    var merged = merge();
    var results = merged.resultsMap;
    var registrations = merged.registrations;

    var elements = _.chain(registrations)
                    .map(r => r.slice(2))
                    .flatten()
                    .map(r => { return { matrnr : r[1], grade : r[5] } })
                    .value();

    var partByGrade = _.partition(elements, r => r.grade && r.grade !== 'x');
    var partByRegistration = _.partition(_.keys(results), r => _.map(elements, e => e.matrnr).indexOf(r) > -1);

    var numberCount = () => _.extend({}, _.fill(new Array(10), 0));
    var sign = (m) => _.values(_.extend(numberCount(), _.countBy(m))).join('');

    // Signs all registered students which have no result
    var regStudsWithoutResult = _.chain(registrations)
             .flatten()
             .filter(r => r[6] === 'x')
             .map(r => { return { sign : sign(r[1]), matrnr : r[1] }; })
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

    var stats = { grades : partByGrade, registrated : partByRegistration, registrations : registrations, results : results, data : fields.results, warnings : warnings };
    return stats;

  };

  this.observeField = (scope, field) => {
    scope.$on(field, (v) =>  {

      scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
          if(fn && (typeof(fn) === 'function')) {
            fn();
          }
        } else {
          this.$apply(fn);
        }
      };

      scope.safeApply(() => {
          scope[field] = this.value(field);
      });
    });
  };

})
