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
    results : { col1 : 0, col2 : 1, data : [] },
    registrations : []
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
    var resultsMap = results.data.slice(1).reduce((o,c) => {
      if(c && c[results.col1]) {
        o[c[results.col1]] = { grade : c[results.col2], data : c };
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

    var stats = { grade : partByGrade, registrated : partByRegistration, registrations : registrations, results : resultsMap, data : fields.results.data };
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

  $scope.results = csvService.value(results);
  csvService.observeField($scope, results);

  $scope.registrations = csvService.value(registrations);
  csvService.observeField($scope, registrations);

  $scope.currentStep = 1;

  var currentStep = () =>  {
    var step = 1;
    if($scope.results.data.length > 0)
      step = 2;
    if($scope.registrations.length > 0)
      step = 3;
    return step;
  };

  $scope.backToStep = (step) => {
    if(step < 3) {
      csvService.value(registrations, []);
    }
    if(step < 2) {
      csvService.value(results, { col1 : 0, col2 : 1, data : [] });
    }
  };

  $scope.$watch(() => [$scope.registrations, $scope.results], (nv, ov) => {
    if($scope.results.data.length > 0 || $scope.registrations.length > 0) {
      var stats = csvService.stats();
      $scope.stats = stats
      $scope.warnings = stats.registrated[1].map(mnr => stats.results[mnr].data);
    }

    $scope.currentStep = currentStep();

  }, true);

  ipc.on(results, function(event, data) {
    var file = { col1 : 2, col2 : 3, data : data};
    csvService.value(results, file);
  });

  ipc.on(registrations, function(event, data) {
    csvService.value(registrations, data);
  });

});
