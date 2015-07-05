/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/commander/commander.d.ts" />
//#!/usr/bin/env node



var program = require('commander');
var path = require('path');
var fs = require('fs');
var colors = require('colors');

var version = '0.0.0';

var map = (function () {
	var mapPath = path.join(__dirname, 'map.json');
	var deSerializeMapFile = function (done) {
		fs.readFile(mapPath, { encoding: 'utf8' }, function (err, data) {
			if (err) done(err, null); else done(null, JSON.parse(data));
		});
	};
	var writeMapFile = function (data, done) {
		fs.writeFile(mapPath, data, function (err) {
			done(err);
		});
	};
	var doesKeyExists = function (json, key) {
		return json.packages.some(function (p) { return p.key.toLowerCase().localeCompare(key.toLowerCase()) == 0; });
	};
	var addPackage = function (key, path, done) {
		deSerializeMapFile(function (err, json) {
			if (err) return done(err);
			//check if already exists 
			if (doesKeyExists(json, key))
				return done(new Error('Package name is not available.'));
			//add package
			var newPackage = { key: key, path: path };
			json.packages.push(newPackage);
			//write back JSON
			writeMapFile(JSON.stringify(json), done);
		});
	};
	var listAllPackages = function (done) {
		deSerializeMapFile(function (err, json) {
			done(err, json.packages.map(function (p) { return p.key; }).sort(function (a, b) { return a.localeCompare(b); }));
		});
	};
	var removePackage = function (key, done) {
		deSerializeMapFile(function (err, json) {
			if (!doesKeyExists(json, key)) done(new Error("Package doesn't exists."));
			if (err) return done(err);
			for (var i = 0; i < json.packages.length; i++) {
				if (json.packages[i].key.toLowerCase().localeCompare(key.toLowerCase()) == 0) {
					json.packages.splice(i,1);
					break;
				}
			}
			writeMapFile(JSON.stringify(json), done);
		});
	};
	return {
		addPackage: addPackage,
		listAllPackages: listAllPackages,
		removePackage: removePackage
	};
})();

program
	.command('pack [dir]')
	.description('Packs the directory with name [dir] or current directory.')
	.action(function (dir) {
	var packagePath = process.cwd();
	if (dir) packagePath = path.join(packagePath, dir);
	fs.stat(packagePath, function (err, stat) {
		if (!(stat && stat.isDirectory()))
			console.log('ERROR '.red + 'Directory not found.');
		else {
			//directory is found -> pack the package.
			var key = path.basename(packagePath);
			map.addPackage(key, packagePath, function (err) {
				if (err) console.log('ERROR '.red + err.message); else console.log('PACKED '.green + key + ' in bagpack successfully.');
			});
		}
	});
});

program
	.command('list')
	.alias('ls')
	.description('Lists all the packages inside the bagpack.')
	.action(function () {
	map.listAllPackages(function (err, arrOfKeys) {
		arrOfKeys.forEach(function (k) { console.log('|- ' + k); });
	});
});

program
	.command('remove [package]')
	.description('Removes a package from the bagpack')
	.action(function (package) {
	if (!package)
		console.log('ERROR '.red + 'Mention a package name.');
	else {
		map.removePackage(package, function (err) {
			if (err) console.log('ERROR '.red + err.message);
			else console.log('REMOVED '.green + package + ' from bagpack successfully.');
		});
	}
});

program.version(version);


program.parse(process.argv);

