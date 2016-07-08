'use strict';
const electron = require('electron');
const app = electron.app;
const csv = require('csv');
const detect = require('detect-csv');
const fs = require('fs');
const $q = require('q');
var stringify = require('csv-stringify');
const encoding = require('encoding');

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

// prevent window being garbage collected
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	console.log('close');
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 800,
		height: 700
	});

	win.loadURL(`file://${__dirname}/index.html`);
	win.on('closed', onClosed);

	return win;
}

function asPromise(func) {
	let d = $q.defer();
	func(d);
	return d.promise;
}

function defaultResolver(def) {
	return (err, data) => {
		if(err) def.reject();
		else def.resolve(data);
	}
}

function readFile(path) {
	return asPromise(d => fs.readFile(path, defaultResolver(d)));
}

function parseCsv(data, options) {
	return asPromise(d => csv.parse(data, options, defaultResolver(d)));
}

function getDelimiter(csvData) {
	var csv = detect(csvData);
	return {delimiter : csv.delimiter};
}

function readCsvFile(path, enc) {
	return readFile(path).then(data => {

		if(enc) {
			data = encoding.convert(data, 'utf8', enc);
		}

		return parseCsv(data, getDelimiter(data))
	});
}

ipc.on('open-tucan-files', function (event) {
	dialog.showOpenDialog({
    properties: ['openFiles', 'multiSelections']
  }, function (files) {
    if (files) {
			$q.allSettled(files.map(file => readCsvFile(file, 'windows1252'))).spread(function() {
				var result = Object.keys(arguments).map(k => arguments[k].value);
				mainWindow.webContents.send('registrations', result);
			});
		}
	})
})

ipc.on('open-result-file', function (event) {
	dialog.showOpenDialog({
    properties: ['openFiles']
  }, function (files) {
    if (files && files.length === 1) {

			readCsvFile(files[0]).then(r => {
				console.log(r);
				mainWindow.webContents.send('results', r);
			});
		}
	})
})

ipc.on('export', function(event, data) {
	if(data) {

		dialog.showOpenDialog({
	    properties: ['openFiles', 'openDirectory']
	  }, function (files) {
	    if (files && files.length === 1) {
				var dir = files[0];
				var errors = [];
				data.forEach((f,index) => {
					stringify(f, {delimiter : '\t'}, function(err, data) {

						var name = dir + '/tucan-' + index + '.txt';
						data = encoding.convert(data, 'windows1252', 'utf8');
						fs.writeFile(name, data, (err) => {
							if(err) {
								errors.push(err);
							}
						});
					});
				});

				if(errors.length > 0) {
					mainWindow.webContents.send('exportError', err);
				} else {
					console.log('export success');
					mainWindow.webContents.send('exportSuccess', {dir : dir, numberOfFiles : data.length});
				}
			}
		})
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	mainWindow = createMainWindow();
});
