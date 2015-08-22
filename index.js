var fs = require('fs');
var path = require('path');
var readline = require('readline');
var colors = require('colors/safe');

var distParamsFile = path.resolve(__dirname,'parameters.json.dist');
var paramsFile = path.resolve(__dirname,'parameters.json');

function fileExists(file){
	return fs.existsSync(file);
}

function readJson(file){
	return JSON.parse(fs.readFileSync(file));
}

function writeJson(file,obj){
	return fs.writeFileSync(file,JSON.stringify(obj,null,8));
}

//writeJson(paramsFile,readJson(distParamsFile));


function compareObject(src,dst,parent){
	var key,value;

	for(key in src){
		srcVal = src[key];
		dstVal = dst && dst[key];

		if (typeof srcVal=='object'){
			compareObject(srcVal,dstVal);
		}else{

			console.log(srcVal,dstVal);
		}
	}
}

var src = readJson(distParamsFile);
var dst = readJson(paramsFile);

// compareObject(src,dst);



var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(colors.green("What do you think of node.js? "), function(answer) {
  // TODO: Log the answer in a database
  console.log("Thank you for your valuable feedback:", answer);

  rl.close();
});