angular.module('csvMerger', ['ui.router','nya.bootstrap.select'])
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
      var grade = resultsMap[s[1]];
      if(grade) {
        s[5] =  grade;
      } else {
        s[6] = 'x';
      }
    }));

    return { resultsMap : resultsMap, registrations : registrations };
  }

  this.merge = () => merge();

  this.stats = () => {

    var merged = merge();
    var resultsMap = merged.resultsMap;
    var registrations = merged.registrations;

    var elements = _.chain(registrations)
                    .map(r => r.slice(2))
                    .flatten()
                    .map(r => { return { matrnr : r[1], grade : r[5] } })
                    .value();

    var partByGrade = _.partition(elements, r => r.grade && r.grade !== 'x');
    var partByRegistration = _.partition(_.keys(resultsMap), r => _.map(elements, e => e.matrnr).indexOf(r) > -1);

    var stats = { grade : partByGrade, registrated : partByRegistration, registrations : registrations, results : resultsMap, data : fields.results };
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
          console.log('apply');
      });
    });
  };

})
.controller('importResultsCtrl', function($scope, csvService) {

  $scope.openFile = function() {
    ipc.send('open-klaus-file');
  };

  $scope.openFiles = function() {
    ipc.send('open-tucan-files');
  };

  $scope.export = function() {
    ipc.send('export', csvService.merge().registrations);
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


  $scope.currentStep = 1;

  var currentStep = () =>  {
    var step = 1;
    if($scope.results.length > 0)
      step = 2;
    if(step === 2 && $scope.columns.col1 && $scope.columns.col2)
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
      csvService.value(columns, { col1 : 0, col2 : 1 });
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
  }, true);

  $scope.$watch('currentStep', (nv, ov) => {
    if(nv && nv === 4) {
      var stats = csvService.stats();
      console.log(stats);
      $scope.stats = stats
      $scope.warnings = stats.registrated[1].map(mnr => stats.results[mnr].data);
    }
  });


  ipc.on(results, function(event, data) {
    $scope.predictedColumns = { col1 : 2, col2 : 3};
    csvService.value(results, data);
  });

  ipc.on(registrations, function(event, data) {
    csvService.value(registrations, data);
  });

});
