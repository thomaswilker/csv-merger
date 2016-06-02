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
    })
    .state('importTucanFiles', {
      url: "/tucan",
      templateUrl: "./app/importTucanFiles.html",
      controller : 'importTucanFilesCtrl'
    })

})
.service('csvService', function($rootScope) {

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

  this.merge = () => {

    var results = fields.results;
    var resultsMap = results.data.slice(1).reduce((o,c) => {
      if(c && c[results.col1]) {
        o[c[results.col1]] = c[results.col2];
      }
      return o;
    }, {});

    var registrations = fields.registrations;

    registrations.forEach((f,index) => {
      f.slice(2).forEach(s => {
        s[5] = resultsMap[s[1]] ? resultsMap[s[1]] : 'x';
      });
    });

    console.log(registrations);
  };

  this.observeField = (scope, field) => {
    scope.$on(field, (v) =>  {
      scope.$apply(() => {
          scope[field] = this.value(field);
      });
    });
  };

})
.controller('appCtrl', function($rootScope, $scope, csvService) {

    var results = 'results';
    var registrations = 'registrations';
    var numResults = (v) => v.data.length - 1;
    var numRegistrations = (v) =>  v.reduce((i, c) => i + c.length - 2, 0);
    var apply = (c) => $scope.$apply(c);
    var setField = (field, value) => $scope[field] = value;

    setField(results, numResults(csvService.value(results)));
    setField(registrations, numRegistrations(csvService.value(registrations)));

    $scope.$on(results, (e, v) => apply(setField(results, numResults(v))));
    $scope.$on(registrations, (e, v) => apply(setField(registrations, numRegistrations(v))));

    $scope.$watch(() => [$scope.results, $scope.registrations], (nv, ov) => {
      if($scope.results > 0 && $scope.registrations > 0) {
        csvService.merge();
      }
    }, true);
})
.controller('importResultsCtrl', function($scope, csvService) {

  $scope.openFile = function() {
    ipc.send('open-klaus-file');
  };

  var results = 'results';

  $scope.results = csvService.value(results);
  csvService.observeField($scope, results);

  ipc.on(results, function(event, data) {
    var file = { col1 : 2, col2 : 3, data : data};
    csvService.value(results, file);
  });

})
.controller('importTucanFilesCtrl', function($scope, csvService) {

  $scope.openFiles = function() {
    ipc.send('open-tucan-files');
  };

  var registrations = 'registrations';
  $scope.registrations = csvService.value(registrations);
  csvService.observeField($scope, registrations);

  ipc.on(registrations, function(event, data) {
    csvService.value(registrations, data);
  });

});
