angular.module('csvMerger')
.service('stepService', function($state) {

  var current = new Rx.Subject();

  this.current = current;
  this.next = (step) => current.onNext(step);
  current.subscribe((step) => {
      console.log('app.step'+step);
      $state.go('app.step'+step, {reload : true})
  });


});
