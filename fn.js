var self = module.exports;
var fs = require('fs');
var q = require('q');
var colors = require('colors');
var moment = require('moment');
var readline = require('readline');



var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

self.fileExists = function(file){
	return fs.existsSync(file);
};

self.readJson = function(file){
	return JSON.parse(fs.readFileSync(file));
};

self.writeJson = function(file,obj){
	return fs.writeFileSync(file,JSON.stringify(obj,null,4));
};

self.getModifiedMoment = function(file){
	var stat = fs.statSync(file);
	return moment(stat.mtime);
};

self.question = function(msg){
	return q.Promise(function(resolve,request){
		rl.question(msg, function(answer) {
			resolve(answer);
		});
	});
};

self.write = function(msg){
	msg = typeof msg == 'string' ? msg : '';
	rl.write(msg);
};
self.writeLine = function(msg){
	msg = typeof msg == 'string' ? msg : '';
	rl.write(msg+'\n');
};

self.close = function(){
	rl.close();
};



self.comments = {};
self.fetchComments = function(obj){
	self.comments = obj._comment || {};
	delete obj._comment;
};
self.getComment = function(key){
	return self.comments[key] || '';
};

self.compareObject = function(src,dst,parents){
	var final={};
	var done = q.defer();

	var keys = Object.keys(src);
	var i = 0;

	var next = function(){
		var key = keys[i++];

		if (!key){
			return done.resolve(final);
		}

		var srcVal = src[key];
		var dstVal = dst && dst[key];

		if (typeof srcVal=='object'){
			var copyParents = parents.slice();
			copyParents.push(key);
			self.compareObject(srcVal,dstVal,copyParents)
				.then(function(finalVal){
					final[key] = finalVal;
					next();
				});
		}else{
			self.prompt(key,srcVal,dstVal,parents)
				.then(function(finalVal){
					if (finalVal === ''){
						if (typeof dstVal != 'undefined'){
							finalVal = dstVal;
						}else{
							finalVal = srcVal;
						}
					}
					final[key] = finalVal;
					next();
				});
		}
	};

	next();
	return done.promise;
};

self.prompt = function(key,srcVal,dstVal,parents){
	if (parents.length){
		key = parents.join('.')+'.'+key;
	}

	var comment = self.getComment(key);

	if (typeof dstVal == 'undefined'){
		srcVal = colors.bgBlue.underline.black(srcVal);
	}else{
		srcVal = colors.blue(srcVal);
		dstVal = colors.bgBlue.underline.black(dstVal);
	}

	self.writeLine();
	if (comment){
		self.writeLine(colors.grey('#'+comment));
	}
	self.write(key.green);
	self.write(' [default '.yellow);
	self.write(srcVal+']'.yellow);
	if (typeof dstVal != 'undefined'){
		self.write(' [current '.yellow);
		self.write(dstVal+']'.yellow);
	}
	self.writeLine();
	return self.question('> ');
};

//writeJson(paramsFile,readJson(distParamsFile));