angular.module('csvMerger', ['ui.router','nya.bootstrap.select', 'ui.bootstrap', 'rx'])
.run(function() {
  console.log('run');
})
.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/step1');

  $stateProvider
    .state('app', {
      url : '/',
      abstract : true,
      templateUrl: "./app/app.html",
      controller : 'AppCtrl'
    })
    .state('app.step1', {
      url: "step1",
      templateUrl: "./app/controller/step1/importResults.html",
      controller : 'ImportResultsCtrl'
    })
    .state('app.step2', {
      url: "step2",
      templateUrl: "./app/controller/step2/selectColumns.html",
      controller : 'SelectColumnsCtrl'
    })
    .state('app.step3', {
      url: "step3",
      templateUrl: "./app/controller/step3/importRegistrations.html",
      controller : 'ImportRegistrationsCtrl'
    })
    .state('app.step4', {
      url: "step4",
      templateUrl: "./app/controller/step4/exportData.html",
      controller : 'ExportDataCtrl'
    });

})
.constant('_', window._)
.controller('AppCtrl', function($scope, $state, stepService, _) {
  $scope.currentStep = 1;

  stepService.current().subscribe((step) => {
    $scope.currentStep = parseInt(step.slice(step.length-1));
    console.log($scope.currentStep);
  });


  // csvService.source().subscribe(x => console.log('start', x));
  //
  // Rx.Observable.interval(1000).timeInterval().take(20).subscribe(csvService.source());
  //
  // $timeout(function() {
  //   csvService.source().subscribe(x => console.log('nachzuegler', x));
  // }, 5000);

  // $scope.openFile = function() {
  //   ipc.send('open-result-file');
  // };
  //
  // $scope.openFiles = function() {
  //   ipc.send('open-tucan-files');
  // };
  //
  // $scope.export = function() {
	// var merged = csvService.merge();
  //   ipc.send('export', merged.registrations);
  // };
  //
  // var results = 'results';
  // var registrations = 'registrations';
  // var columns = 'columns';
  //
  // $scope.results = csvService.value(results);
  // csvService.observeField($scope, results);
  //
  // $scope.registrations = csvService.value(registrations);
  // csvService.observeField($scope, registrations);
  //
  // $scope.columns = csvService.value(columns);
  // csvService.observeField($scope, columns);
  //
  // $scope.changeMatrnr = function(ov, nv) {
  //   let col = $scope.columns.col1;
  //   let i = _.findIndex($scope.results, (r) => r[col] === ov);
  //   $scope.results[i][col] = nv;
  //   csvService.value(results, $scope.results);
  // };
  //
  // $scope.currentStep = 1;
  //
  // var currentStep = () =>  {
  //   var step = 1;
  //   if($scope.results.length > 0)
  //     step = 2;
  //   if(step === 2 && $scope.columns.col1 != null && $scope.columns.col2 != null)
  //     step = 3;
  //   if(step === 3 && $scope.registrations.length > 0)
  //     step = 4;
  //   return step;
  // };
  //
  // $scope.backToStep = (step) => {
  //   if(step < 4) {
  //     csvService.value(registrations, []);
  //   }
  //   if(step < 3) {
  //     csvService.value(columns, { col1 : null, col2 : null });
  //   }
  //   if(step < 2) {
  //     csvService.value(results, []);
  //   }
  // };
  //
  // $scope.selectColumns = () => {
  //   csvService.value(columns, $scope.predictedColumns);
  // };
  //
  // $scope.$watch(() => [$scope.registrations, $scope.results, $scope.columns], (nv, ov) => {
  //   $scope.currentStep = currentStep();
  //   var stats = csvService.stats();
  //   $scope.warnings = stats.warnings;
  // }, true);
  //
  // $scope.$watch('currentStep', (nv, ov) => {
  //   if(nv && nv === 4) {
  //     var stats = csvService.stats();
  //     $scope.warnings = stats.warnings;
  //   }
  // }, true);
  //
  // function random(column, percentage) {
  //   var size = Math.min(column.length, Math.floor(column.length * percentage));
  //   return Array.from(Array(size).keys()).map(() => Math.floor(size * Math.random()));
  // }
  //
  // var isRealNumber = (n) => !_.isNaN(n) && _.isNumber(n);
  //
  // var isResult = (v) => {
  //   var n = parseInt(v);
  //   return  isRealNumber(n) && Math.floor(n).toString().length === 1;
  // };
  //
  // var isMatriculationNumber = (v) => {
  //   var n = parseInt(v);
  //   return  isRealNumber(n) && v.length < 9 && v.length > 6;
  // };
  //
  // var isPredictedColumn = (column, samples, pred) => _.every(random(column, samples).map(i => column[i]), pred);
  // var getPredictedColumn = (columns, samples, pred) => _.findIndex(columns, (column) => isPredictedColumn(column, samples, pred));
  //
  // ipc.on(results, function(event, data) {
  //
  //   var rows = data.slice(1);
  //   var columns = _.zipWith(...rows, (...args) => _.values(args));
  //   var matriculationColumn = getPredictedColumn(columns, 0.5, isMatriculationNumber);
  //   var resultColumn = getPredictedColumn(columns, 0.5, isResult);
  //
  //   $scope.predictedColumns = { col1 : matriculationColumn, col2 : resultColumn};
  //   csvService.value(results, data);
  //
  // });
  //
  // ipc.on(registrations, function(event, data) {
  //   csvService.value(registrations, data);
  // });
  //
  // ipc.on('exportSuccess', function(event, data) {
  //
  //   var success = true;
  //
  //   var modalInstance = $uibModal.open({
  //       animation: false,
  //       templateUrl: 'modal.html',
  //       controller: 'ModalCtrl',
  //       size: 'lg',
  //       resolve : {
  //         success : function() {
  //           return success;
  //         },
  //         data : function() {
  //           return data;
  //         }
  //       }
  //   });
  //
  //   modalInstance.result.then(function () {
  //     $scope.backToStep(1);
  //   }, function () {});
  // });

});
