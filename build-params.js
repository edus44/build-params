#!/usr/bin/env node

var path = require('path');
var util = require('util');
var colors = require('colors');
var q = require('q');
var package = require('./package.json');
var argv = require('yargs').argv;

var fn = require('./fn.js');
var cwd = process.cwd();


fn.writeLine();
fn.writeLine(package.name+' '+package.version);

if (argv.help){
	fn.writeLine();
	fn.writeLine(' --help            Show this message'.yellow);
	fn.writeLine(' --src=<filename>  Source (dist) JSON file (default=parameters.json.dist)'.yellow);
	fn.writeLine(' --dst<filename>   Destination JSON file (default=parameters.json)'.yellow);
	fn.writeLine(' --print-src       Print the source JSON file'.yellow);
	fn.writeLine(' --print-dst       Print the destination JSON file'.yellow);
	fn.writeLine(' --review          Navigate through all keys'.yellow);
	fn.writeLine();
	fn.exit(0);
}else{
	fn.writeLine('Use --help to show available options');
	fn.writeLine();
}

var srcFilename = argv.src || 'parameters.json.dist';
var dstFilename = argv.dst || 'parameters.json';

////////////////
//Source file //
////////////////
var srcFile = path.resolve(cwd,srcFilename);

//Handle file not found
if (!fn.fileExists(srcFile)){
	fn.writeLine(colors.red(srcFile+' not found'));
	fn.exit();
}

try{
	var src = fn.readJson(srcFile);
}catch(e){
	fn.writeLine(colors.red('Malformed JSON '+srcFile));
	fn.exit();
}
var srcMoment = fn.getModifiedMoment(srcFile);

/////////////////////
//Destination file //
/////////////////////
var dstFile = path.resolve(cwd,dstFilename);
var dstExists = fn.fileExists(dstFile);
var dstMalformed = false;
try{
	var dst = dstExists ? fn.readJson(dstFile) : {};
}catch(e){
	dstMalformed = true;
	dst = {};
}
var dstMoment = dstExists ? fn.getModifiedMoment(dstFile) : null;


////////////////
//Init output //
////////////////
//Cwd
fn.writeLine('Current directory:'.green);
fn.writeLine(cwd.blue);
fn.writeLine();

//Source file
fn.writeLine('Source json file:'.green);
fn.write	(path.basename(srcFile).blue);
fn.writeLine(colors.blue('  (modified '+srcMoment.fromNow()+ ' - ' +srcMoment.format('DD-MM-YYYY hh:mm:ss')+')'));
fn.writeLine();

//Dest file
fn.writeLine('Destination json file:'.green);

fn.write	(path.basename(dstFile).blue);
if (dstExists){
	if (dstMalformed){
		fn.writeLine('  (Malformed JSON, will create new one)'.red);
	}else{
		fn.writeLine(colors.blue('  (modified '+dstMoment.fromNow()+ ' - ' +dstMoment.format('DD-MM-YYYY hh:mm:ss')+')'));
	}
}else{
	fn.writeLine('  (Doesn\`t exists, will create new one)'.red);
}

if (argv.printSrc || argv.printDst){

	if (argv.printSrc){
		fn.writeLine();
		fn.writeLine('Source JSON file:'.green);
		fn.writeLine(JSON.stringify(src,null,4).blue);
	}
	if (argv.printDst){
		fn.writeLine();
		fn.writeLine('Destination JSON file:'.green);
		fn.writeLine(JSON.stringify(dst,null,4).blue);
	}
	fn.exit();
}



//Save the _comment object
fn.fetchComments(src);

//Start the loop
fn.compareObject(src,dst,[],{
	review : !!argv.review
})
	.then(function(final){
		if (fn.hasChanges){
			fn.writeLine();
			fn.writeLine('Final JSON file:'.green);
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
		fn.exit();
	});

