angular.module('csvMerger')
.controller('ImportRegistrationsCtrl', function($scope, csvService, stepService, $state) {

  $scope.openFiles = function() {
     ipc.send('open-tucan-files');
  };

  ipc.on('registrations', function(event, data) {
     csvService.registrations = data;
     $state.go('app.step4');
  });

});
