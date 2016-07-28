angular.module('csvMerger')
.controller('ExportDataCtrl', function($uibModal) {

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
