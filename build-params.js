#!/usr/bin/env node

var path = require('path');
var util = require('util');
var colors = require('colors');
var q = require('q');
var package = require('./package.json');
var argv = require('yargs').argv;

var fn = require('./fn.js');
var cwd = process.cwd();

var testParamsFile = path.resolve(cwd,'test.json');

//Source file
var srcFile = path.resolve(cwd,'parameters.json.dist');
var src = fn.readJson(srcFile);
var srcMoment = fn.getModifiedMoment(srcFile);

//Destination file
var dstFile = path.resolve(cwd,'parameters.json');
var dstExists = fn.fileExists(dstFile);
var dst = dstExists ? fn.readJson(dstFile) : {};
var dstMoment = dstExists ? fn.getModifiedMoment(dstFile) : null;

fn.writeLine();
fn.writeLine(package.name+' '+package.version);
fn.writeLine();
fn.writeLine('Current directory:'.green);
fn.writeLine(cwd.blue);
fn.writeLine();
fn.writeLine('Source json file:'.green);
fn.write	(path.basename(srcFile).blue);
fn.writeLine(colors.blue('  (modified '+srcMoment.fromNow()+ ' - ' +srcMoment.format('DD-MM-YYYY hh:mm:ss')+')'));
fn.writeLine();
fn.writeLine('Destination json file:'.green);

fn.write	(path.basename(dstFile).blue);
if (dstExists){
	fn.writeLine(colors.blue('  (modified '+dstMoment.fromNow()+ ' - ' +dstMoment.format('DD-MM-YYYY hh:mm:ss')+')'));
}else{
	fn.writeLine('  (Doesn\`t exists, will create new one)'.red);
}

fn.fetchComments(src);

fn.compareObject(src,dst,[],{
	review : !!argv.review
})
	.then(function(final){
		if (fn.hasChanges){
			fn.writeLine();
			fn.writeLine('Final json file:'.green);
			fn.writeLine(JSON.stringify(final,null,4).blue);
			fn.writeJson(dstFile,final);

			fn.writeLine();
			fn.writeLine('Writted succesfully'.green);
			fn.writeLine();
		}else{
			fn.writeLine();
			fn.writeLine('No changes were found'.yellow);
			fn.writeLine('Use --review to navigate through all keys'.yellow);
		}

		fn.close();
	})
	.catch(function(err){
		fn.writeLine();
		fn.writeLine('Error happened'.red);
		console.log(err);
		fn.close();
	});

