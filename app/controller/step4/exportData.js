angular.module('csvMerger')
.controller('ExportDataCtrl', function($scope, $uibModal, csvService) {

    var stats = {registrations, results, warnings, columns} = csvService.stats();
    Object.assign($scope, stats);
    console.log($scope.warnings);

    $scope.export = function() {
	   ipc.send('export', $scope.registrations);
    };

    $scope.changeMatrnr = function(ov, nv) {
        let col = $scope.columns.col1;
        let i = _.findIndex($scope.results, (r) => r[col] === ov);
        $scope.results[i][col] = nv;
    };

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
    });

})
.controller('ModalCtrl', function($scope, $uibModalInstance, success, data, $state) {

    const remote = require('electron').remote;

    $scope.data = data;
    $scope.success = success;

    $scope.ok = function () {
      console.log('ok');
      $state.go('app.step1');
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      console.log('close');
      $uibModalInstance.dismiss('cancel');
      var window = remote.getCurrentWindow();
      window.close();
    };
});
