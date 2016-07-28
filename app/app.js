angular.module('csvMerger', ['ui.router','nya.bootstrap.select', 'ui.bootstrap'])
.run(function() {
  console.log('run');
})
.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/');

  $stateProvider
    .state('importResults', {
      url: "/",
      templateUrl: "./app/importResults.html",
      controller : 'importResultsCtrl'
    });

})
.constant('_', window._)
.service('csvService', function($rootScope, _) {

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
.controller('importResultsCtrl', function($scope, csvService, _, $uibModal) {

  $scope.openFile = function() {
    ipc.send('open-result-file');
  };

  $scope.openFiles = function() {
    ipc.send('open-tucan-files');
  };

  $scope.export = function() {
	var merged = csvService.merge();
    ipc.send('export', merged.registrations);
  };

  var results = 'results';
  var registrations = 'registrations';
  var columns = 'columns';

  $scope.results = csvService.value(results);
  csvService.observeField($scope, results);

  $scope.registrations = csvService.value(registrations);
  csvService.observeField($scope, registrations);

  $scope.columns = csvService.value(columns);
  csvService.observeField($scope, columns);

  $scope.changeMatrnr = function(ov, nv) {
    let col = $scope.columns.col1;
    let i = _.findIndex($scope.results, (r) => r[col] === ov);
    $scope.results[i][col] = nv;
    csvService.value(results, $scope.results);
  };

  $scope.currentStep = 1;

  var currentStep = () =>  {
    var step = 1;
    if($scope.results.length > 0)
      step = 2;
    if(step === 2 && $scope.columns.col1 != null && $scope.columns.col2 != null)
      step = 3;
    if(step === 3 && $scope.registrations.length > 0)
      step = 4;
    return step;
  };

  $scope.backToStep = (step) => {
    if(step < 4) {
      csvService.value(registrations, []);
    }
    if(step < 3) {
      csvService.value(columns, { col1 : null, col2 : null });
    }
    if(step < 2) {
      csvService.value(results, []);
    }
  };

  $scope.selectColumns = () => {
    csvService.value(columns, $scope.predictedColumns);
  };

  $scope.$watch(() => [$scope.registrations, $scope.results, $scope.columns], (nv, ov) => {
    $scope.currentStep = currentStep();
    var stats = csvService.stats();
    $scope.warnings = stats.warnings;
  }, true);

  $scope.$watch('currentStep', (nv, ov) => {
    if(nv && nv === 4) {
      var stats = csvService.stats();
      $scope.warnings = stats.warnings;
    }
  }, true);

  function random(column, percentage) {
    var size = Math.min(column.length, Math.floor(column.length * percentage));
    return Array.from(Array(size).keys()).map(() => Math.floor(size * Math.random()));
  }

  var isRealNumber = (n) => !_.isNaN(n) && _.isNumber(n);

  var isResult = (v) => {
    var n = parseInt(v);
    return  isRealNumber(n) && Math.floor(n).toString().length === 1;
  };

  var isMatriculationNumber = (v) => {
    var n = parseInt(v);
    return  isRealNumber(n) && v.length < 9 && v.length > 6;
  };

  var isPredictedColumn = (column, samples, pred) => _.every(random(column, samples).map(i => column[i]), pred);
  var getPredictedColumn = (columns, samples, pred) => _.findIndex(columns, (column) => isPredictedColumn(column, samples, pred));

  ipc.on(results, function(event, data) {

    var rows = data.slice(1);
    var columns = _.zipWith(...rows, (...args) => _.values(args));
    var matriculationColumn = getPredictedColumn(columns, 0.5, isMatriculationNumber);
    var resultColumn = getPredictedColumn(columns, 0.5, isResult);

    $scope.predictedColumns = { col1 : matriculationColumn, col2 : resultColumn};
    csvService.value(results, data);

  });

  ipc.on(registrations, function(event, data) {
    csvService.value(registrations, data);
  });

  ipc.on('exportSuccess', function(event, data) {

    var success = true;

    var modalInstance = $uibModal.open({
        animation: false,
        templateUrl: 'modal.html',
        controller: 'ModalCtrl',
        size: 'lg',
        resolve : {
          success : function() {
            return success;
          },
          data : function() {
            return data;
          }
        }
    });

    modalInstance.result.then(function () {
      $scope.backToStep(1);
    }, function () {});
  });

})
.controller('ModalCtrl', function($scope, $uibModalInstance, success, data) {

    const remote = require('electron').remote;

    $scope.data = data;
    $scope.success = success;

    $scope.ok = function () {
      console.log('ok');
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      console.log('close');
      $uibModalInstance.dismiss('cancel');
      var window = remote.getCurrentWindow();
      window.close();
    };
});
