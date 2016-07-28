angular.module('csvMerger')
.controller('ExportDataCtrl', function($scope, $uibModal, csvService) {

    var {registrations, results, warnings} = csvService.stats();

    $scope.registrations = registrations;
    $scope.results = results;
    $scope.warnings = warnings;
    $scope.columns = csvService.columns;


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
