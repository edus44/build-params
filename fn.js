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

//Fix color in prompt msg
rl._setPrompt = rl.setPrompt;
rl.setPrompt = function(prompt, length){
    rl._setPrompt(prompt, length ? length : prompt.split(/[\r\n]/).pop().stripColors.length);
};


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

self.question = function(msg,def){
	return q.Promise(function(resolve,request){
		rl.question(msg, function(answer) {
			resolve(answer);
		});
		rl.write(def);
	});
};

self.write = function(msg){
	msg = typeof msg == 'string' ? msg : '';
	process.stdout.write(msg);
};
self.writeLine = function(msg){
	msg = typeof msg == 'string' ? msg : '';
	process.stdout.write(msg+'\n');
};

self.close = function(){
	rl.close();
};

self.exit = function(ret){
	rl.close();
	process.exit(typeof ret == 'undefined' ? 1 : ret);
};



self.comments = {};
self.fetchComments = function(obj){
	self.comments = obj._comment || {};
	delete obj._comment;
};
self.getComment = function(key){
	return self.comments[key] || '';
};


self.hasChanges = false;
self.newKeys = [];

self.compareObject = function(src,dst,parents,options){
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
			self.compareObject(srcVal,dstVal,copyParents,options)
				.then(function(finalVal){
					final[key] = finalVal;
					next();
				});
		}else{
			if (!options.review && typeof dstVal != 'undefined'){
				final[key] = dstVal;
				next();
			}else{
				self.hasChanges = true;

				if (!options.check){
					self.prompt(key,srcVal,dstVal,parents,options)
						.then(function(finalVal){

							//Casting to number
							if(typeof srcVal == 'number'){
								finalVal = parseFloat(finalVal);
								if (isNaN(finalVal)){
									i--;
									self.writeLine('The value has to be a number'.red);
								}
							}

							//Casting to boolean
							if(typeof srcVal == 'boolean'){
								if (finalVal!=='true' && finalVal!=='false'){
									i--;
									self.writeLine('The value has to be true or false'.red);
								}
								finalVal = finalVal === 'true';
							}

							//Value assignment
							final[key] = finalVal;

							//Next key
							next();
						});
				}else{
					if (parents.length){
						key = parents.join('.')+'.'+key;
					}
					self.newKeys.push(key);
					next();
				}
			}
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
	var defVal;
	var srcType = typeof srcVal;

	if (typeof dstVal == 'undefined'){
		defVal = srcVal;
		srcVal = colors.bold.underline.blue(srcVal);
	}else{
		defVal = dstVal;
		srcVal = colors.bold.blue(srcVal);
		dstVal = colors.bold.underline.blue(dstVal);
	}

	self.writeLine();
	self.write(key.bold.green);

	if (srcType == 'number' || srcType == 'boolean')
		self.write((' ['+srcType+']').grey);

	self.writeLine(comment ? colors.grey.bold(' #'+comment): '');

	self.writeLine('default: '.yellow + srcVal);
	if (typeof dstVal != 'undefined'){
		self.writeLine('current: '.yellow + dstVal);
	}
	return self.question('    new: '.yellow,defVal+"");
};


//writeJson(paramsFile,readJson(distParamsFile));