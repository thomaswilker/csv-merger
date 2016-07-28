angular.module('csvMerger')
.controller('ImportResultsCtrl', function($scope, $state, csvService, stepService) {

  $scope.openFile = () => ipc.send('open-result-file');
  
  ipc.on('results', function(event, data) {

    function random(column, percentage) {
      var size = Math.min(column.length, Math.floor(column.length * percentage));
      return Array.from(Array(size).keys()).map(() => Math.floor(size * Math.random()));
    }

    var isRealNumber = (n) => !_.isNaN(n) && _.isNumber(n);

    var isResult = (v) => {
      var n = parseInt(v);
      return  isRealNumber(n) && Math.floor(n).toString().length === 1;
    };

    var isMatriculationNumber = (v) => {
      var n = parseInt(v);
      return  isRealNumber(n) && v.length < 9 && v.length > 6;
    };

    var isPredictedColumn = (column, samples, pred) => _.every(random(column, samples).map(i => column[i]), pred);
    var getPredictedColumn = (columns, samples, pred) => _.findIndex(columns, (column) => isPredictedColumn(column, samples, pred));

    var rows = data.slice(1);
    var columns = _.zipWith(...rows, (...args) => _.values(args));
    var matriculationColumn = getPredictedColumn(columns, 0.5, isMatriculationNumber);
    var resultColumn = getPredictedColumn(columns, 0.5, isResult);

    // set predicted columns and resolved data
    csvService.columns = { col1 : matriculationColumn, col2 : resultColumn};
    csvService.results = data;
    stepService.next(2);

  });



});
