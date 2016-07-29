angular.module('csvMerger')
.factory('stepService', function($state, $rootScope, csvService) {

  var current = new Rx.Subject();

  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
    current.onNext(toState.name);
  });

  return current;

});
