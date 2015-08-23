#!/usr/bin/env node

var path = require('path');
var util = require('util');
var colors = require('colors');
var q = require('q');
var package = require('./package.json');
var argv = require('yargs').argv;

var fn = require('./fn.js');

var testParamsFile = path.resolve(__dirname,'test.json');

//Source file
var srcFile = path.resolve(__dirname,'parameters.json.dist');
var src = fn.readJson(srcFile);
var srcMoment = fn.getModifiedMoment(srcFile);

//Destination file
var dstFile = path.resolve(__dirname,'parameters.json');
var dstExists = fn.fileExists(dstFile);
var dst = dstExists ? fn.readJson(dstFile) : {};
var dstMoment = dstExists ? fn.getModifiedMoment(dstFile) : null;

fn.writeLine();
fn.writeLine(package.name+' '+package.version);
fn.writeLine();
fn.writeLine('Current directory:'.green);
fn.writeLine(__dirname.blue);
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
	fn.writeLine('  (Doesn\`t exists, will create new one)'.blue);
}

fn.fetchComments(src);

fn.compareObject(src,dst,[])
	.then(function(final){
		fn.writeLine();
		fn.writeLine('Final json file:'.green);
		fn.writeLine(JSON.stringify(final,null,4).blue);
		fn.writeJson(dstFile,final);

		fn.writeLine();
		fn.writeLine('Done');

		fn.close();
	});

