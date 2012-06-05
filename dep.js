var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;
var fs = require('fs');
var path = require('path');
var vm = require('vm');

function getDependencyGraph(config){
  var rootPath = config.rootPath;
  var basisPath = config.basisPath;
  var getFileContent = config.getFileContent || function(path){ return fs.readFileSync(path, 'UTF-8');};
  var initialFiles = config.initialFiles;

  function arraysEqual(a, b){
    if (a.length != b.length)
      return false;
    for (var i = 0; i < a.length; i++) {
      if (Array.isArray(a[i]))
        if (!arraysEqual(a[i], b[i]))
          return false;
        else
          continue;
      if (a[i] != b[i])
        return false;
    }
    return true;
  }

  function pushInArray(object, array, value){
    if(!object[array]){
      object[array] = [];
    }
    if(object[array].indexOf(value) === -1)
      object[array].push(value);
  }

  function getAST(code){
    //return top level statement's ast
    return jsp.parse(code)[1][0][1];
  }

  function astEqualsCode(expr, code){
    return arraysEqual(expr, getAST(code));
  }

  var walker = pro.ast_walker();

  var astIdentity = function(){
    return walker.walk(ast);
  };

  function astEvalArgs(args, context){
    return args.map(function(arg){
      if (arg[0] == 'string')
      {
        return arg[1];
      }
      else
      {
        var code = pro.gen_code(arg);
        try
        {
          var result = vm.runInNewContext(code, context);
          if (typeof result == 'string')
          {
            return result;
          }
        }
        catch(e)
        {
          console.log('unable to evaluate "', code, '" in context ', context);
        }
      }
    });
  }

  var fileQueue = initialFiles;
  var processedFiles = {};
  var deps = {};
  var resources = {};

  function addInFileQueue(file){
    if (file.match(/\.js$/) && !processedFiles[file]){
      processedFiles[file] = true;
      fileQueue.push(file);
    }
  }

  var process = function(file, expr, args){
    var dirname = path.dirname(file);
    var context = {
      __filename: path.resolve(rootPath,file),
      __dirname: path.resolve(rootPath, dirname)
    };
    var eargs;

    if (astEqualsCode(expr, 'basis.resource')){
      eargs = astEvalArgs(args, context);
      if(eargs[0]){
        addInFileQueue(eargs[0]);
        pushInArray(resources, file, eargs[0]);
      }
    }

    if (astEqualsCode(expr, 'resource')){
      eargs = astEvalArgs(args, context);
      if(eargs[0]){
        var fileName = dirname + '/' + eargs[0];
        addInFileQueue(fileName);
        pushInArray(resources, file, fileName);
      }
    }

    if (astEqualsCode(expr, 'basis.require')){
      eargs = astEvalArgs(args, context);
      if(eargs[0]){
        addInFileQueue(eargs[0].replace(/\./g, '/').replace(/^basis/, basisPath) + '.js');
        pushInArray(deps, file, eargs[0]);
      }
    }
    
  };

  var processWithFile = function(file){
    return function(){
      var args = Array.prototype.slice.call(arguments);
      process.apply(this, [file].concat(args));
    };
  };

  do {
    var file = fileQueue.shift();
    
    var code = getFileContent(file);
    var ast = jsp.parse(code);

    walker.with_walkers({
      "call": processWithFile(file)
    }, astIdentity);
  } while(fileQueue.length);

  return {
    deps:deps,
    resources: resources
  };
}

module.exports = {
  getDependencyGraph: getDependencyGraph
};