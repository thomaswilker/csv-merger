angular.module('csvMerger', ['ui.router','ngAnimate','nya.bootstrap.select'])
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
        o[c[results.col1]] = c[results.col2];
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

    var stats = { grade : partByGrade, registrated : partByRegistration };
    return stats;

  };

  this.observeField = (scope, field) => {
    scope.$on(field, (v) =>  {
      scope.$apply(() => {
          scope[field] = this.value(field);
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

  $scope.$watch(() => [$scope.registrations, $scope.results], (nv, ov) => {
    if($scope.results.data.length > 0 || $scope.registrations.length > 0) {
      $scope.stats = csvService.stats();
    }
  }, true);

  ipc.on(results, function(event, data) {
    var file = { col1 : 2, col2 : 3, data : data};
    csvService.value(results, file);
  });

  ipc.on(registrations, function(event, data) {
    csvService.value(registrations, data);
  });

});
