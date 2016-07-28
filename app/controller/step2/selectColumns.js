angular.module('csvMerger')
.controller('SelectColumnsCtrl', function($scope, csvService, stepService) {

  console.log('select columns');
  $scope.results = csvService.results;
  $scope.predictedColumns = csvService.columns;
  $scope.selectColumns = (step) => stepService.next(step);

});
