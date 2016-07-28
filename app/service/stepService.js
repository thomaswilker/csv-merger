angular.module('csvMerger')
.service('stepService', function($state, $rootScope) {

  var current = new Rx.Subject();

  $rootScope.$on('$stateChangeStart', function(event, toState) {
    console.log(toState.name);
    current.onNext(toState.name);
  });

  this.current = (step) => {
    if(step) current.onNext(step)
    else return current;
  };

});
