angular.module('csvMerger')
.controller('ImportRegistrationsCtrl', function($scope, stepService) {

  $scope.nextStep = stepService.next;

});
