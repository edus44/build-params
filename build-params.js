#!/usr/bin/env node

var path = require('path');
var util = require('util');
var colors = require('colors');
var extend = require('extend');
var q = require('q');
var package = require('./package.json');
var argv = require('yargs').argv;

var fn = require('./fn.js');
var cwd = process.cwd();


fn.writeLine();
fn.writeLine(package.name+' '+package.version);

if (argv.help){
	fn.writeLine();
	fn.writeLine(' --help               Show this message'.yellow);
	fn.writeLine(' --src <filename>     Source (dist) JSON file (default=parameters.json.dist)'.yellow);
	fn.writeLine(' --dst <filename>     Destination JSON file (default=parameters.json)'.yellow);
	fn.writeLine(' --override <suffix>  Suffix for \'parameters.{suffix}.json.dist\', overrides source keys'.yellow);
	fn.writeLine(' --print-src          Print the source JSON file'.yellow);
	fn.writeLine(' --print-dst          Print the destination JSON file'.yellow);
	fn.writeLine(' --review             Navigate through all keys'.yellow);
	fn.writeLine(' --check              Only check for differences between src and dst'.yellow);
	fn.writeLine();
	fn.exit(0);
}else{
	fn.writeLine('Use --help to show available options');
	fn.writeLine();
}

var override = argv.override;
var ovrFilename = 'parameters.'+override+'.json.dist';
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


//////////////////
//Override file //
//////////////////

if (override){
	var ovrFile = path.resolve(cwd,ovrFilename);

	//Handle file not found
	if (!fn.fileExists(ovrFile)){
		fn.writeLine(colors.red(ovrFile+' not found'));
		fn.exit();
	}

	try{
		var ovr = fn.readJson(ovrFile);
	}catch(e){
		fn.writeLine(colors.red('Malformed JSON '+ovrFile));
		fn.exit();
	}
	var ovrMoment = fn.getModifiedMoment(ovrFile);
}

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
//Override
if (override){
	fn.writeLine('Override:'.green);
	fn.writeLine(argv.override.blue);
	fn.writeLine();
}

//Cwd
fn.writeLine('Current directory:'.green);
fn.writeLine(cwd.blue);
fn.writeLine();

//Source file
fn.writeLine('Source json file:'.green);
fn.write	(path.basename(srcFile).blue);
fn.writeLine(colors.blue('  (modified '+srcMoment.fromNow()+ ' - ' +srcMoment.format('DD-MM-YYYY hh:mm:ss')+')'));
fn.writeLine();

//Override file
if (override){
	fn.writeLine('Override json file:'.green);
	fn.write	(path.basename(ovrFile).blue);
	fn.writeLine(colors.blue('  (modified '+srcMoment.fromNow()+ ' - ' +srcMoment.format('DD-MM-YYYY hh:mm:ss')+')'));
	fn.writeLine();
}

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

		if (override){
			fn.writeLine();
			fn.writeLine('Override JSON file:'.green);
			fn.writeLine(JSON.stringify(ovr,null,4).blue);
		}
	}
	if (argv.printDst){
		fn.writeLine();
		fn.writeLine('Destination JSON file:'.green);
		fn.writeLine(JSON.stringify(dst,null,4).blue);
	}
	fn.exit();
}


//Overrides json
if (override){
	extend(true,src,ovr);
}

//Save the _comment object
fn.fetchComments(src);

//Start the loop
var check = !!argv.check;
fn.compareObject(src,dst,[],{
	review : !!argv.review,
	check : check,
})
	.then(function(final){

		if(!check){
			if (fn.hasChanges){
				fn.writeLine();
				fn.writeLine('Final JSON file:'.green);
				fn.writeLine(JSON.stringify(final,null,4).blue);
				fn.writeJson(dstFile,final);
		
				fn.writeLine('Writted succesfully'.green);
				fn.writeLine();
			}else{
				fn.writeLine();
				fn.writeLine('No changes were found'.yellow);
				fn.writeLine('Use --review to navigate through all keys'.yellow);
			}
			fn.close();
		}else{

			if (fn.hasChanges){			
				fn.writeLine();
				fn.writeLine('-------------------------------------'.yellow);
				fn.writeLine('|  New keys found:'.yellow);
				fn.writeLine('|  '.yellow+fn.newKeys.toString().yellow.bold);
				fn.writeLine('-------------------------------------'.yellow);
				fn.writeLine();

				setTimeout(function(){
					fn.exit(1);
				},1500);
			}else{
				fn.writeLine();
				fn.writeLine('-------------------------------------'.green);
				fn.writeLine('| No changes were found'.green);
				fn.writeLine('-------------------------------------'.green);

				setTimeout(function(){
					fn.close();
				},500);
			}
		}

	})
	.catch(function(err){
		fn.writeLine();
		fn.writeLine('Error happened'.red);
		console.log(err);
		fn.exit();
	});

