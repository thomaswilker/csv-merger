'use strict';
const electron = require('electron');
const app = electron.app;
const csv = require('csv');
const fs = require('fs');
const $q = require('q');
var stringify = require('csv-stringify');

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

// prevent window being garbage collected
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 600,
		height: 400
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


function readTucanFile(path) {
	return readFile(path).then(data => parseCsv(data, {delimiter : '\t'}))
}

function readKlausFile(path) {
	return readFile(path).then(data => parseCsv(data, {delimiter : ';'}))
}

var tucanFiles = [];
var klausFile = {};

ipc.on('open-tucan-files', function (event) {
	dialog.showOpenDialog({
    properties: ['openFiles', 'multiSelections']
  }, function (files) {
    if (files) {
			$q.allSettled(files.map(file => readTucanFile(file))).spread(function() {
				tucanFiles = Object.keys(arguments).map(k => arguments[k].value);
				mainWindow.webContents.send('registrations', tucanFiles);
			});
		}
	})
})

ipc.on('open-klaus-file', function (event) {
	dialog.showOpenDialog({
    properties: ['openFiles']
  }, function (files) {
    if (files && files.length === 1) {
			readKlausFile(files[0]).then(a => {
				klausFile = a;
				mainWindow.webContents.send('results', a);
			});
		}
	})
})

ipc.on('generate-export', function(event) {
	if(klausFile && tucanFiles.length > 0) {

		dialog.showOpenDialog({
	    properties: ['openFiles', 'openDirectory']
	  }, function (files) {
	    if (files && files.length === 1) {

				var dir = files[0];
				var mmap = klausFile.slice(1).reduce((o,c) => {
					if(c && c[2]) {
						o[c[2]] = c[3];
					}
					return o;
				}, {});

				tucanFiles.forEach((f,index) => {
					f.slice(2).forEach(s => {
						if(s[1] && mmap[s[1]]) {
							s[5] = mmap[s[1]];
						}
					});
					stringify(f, {delimiter : '\t'}, function(err, data) {
						var name = dir + '/tucan-' + index + '.txt';
						fs.writeFile(name, data, 'utf8', (err) => {
							console.log(err);
						});
					});
				});

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
