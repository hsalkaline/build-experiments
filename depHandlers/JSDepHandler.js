var fs = require('fs');
var path = require('path');
var vm = require('vm');
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

function arraysEqual(a, b){
  if (a.length != b.length)
    return false;
  for (var i = 0; i < a.length; i++) {
    if (Array.isArray(a[i]))
    {
      if (!arraysEqual(a[i], b[i]))
        return false;
      else
        continue;
    }
    if (a[i] != b[i])
      return false;
  }
  return true;
}

function getAST(code){
  //return top level statement's ast
  return jsp.parse(code)[1][0][1];
}

function astEqualsCode(expr, code){
  return arraysEqual(expr, getAST(code));
}

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
        //console.log('unable to evaluate "', code, '" in context ', context);
      }
    }
  });
}


function JSFileHandler(){
  var walker = pro.ast_walker();

  function handle(file, config){
    var fileList = [];
    var fileDeps = [];

    function pushInFileList(fileName){
      fileList.push({
        fileName: fileName,
        content: fs.readFileSync(path.resolve(config.rootPath, fileName), 'UTF-8')
      });
    }

    function process(file, config, expr, args){
      var dirname = path.dirname(file);
      var context = {
        __filename: path.resolve(config.rootPath,file),
        __dirname: path.resolve(config.rootPath, dirname)
      };
      var eargs, fileName;

      if (astEqualsCode(expr, 'basis.resource')){
        eargs = astEvalArgs(args, context);
        if(eargs[0]){
          fileName = eargs[0];
          pushInFileList(fileName);
          fileDeps.push({
            type: 'basis.resource',
            fileName: fileName
          });
        }
      }

      if (astEqualsCode(expr, 'resource')){
        eargs = astEvalArgs(args, context);
        if(eargs[0]){
          fileName = dirname + '/' + eargs[0];
          pushInFileList(fileName);
          fileDeps.push({
            type: 'basis.resource',
            fileName: fileName
          });
        }
      }

      if (astEqualsCode(expr, 'basis.require')){
        eargs = astEvalArgs(args, context);
        if(eargs[0]){
          fileName = eargs[0].replace(/\./g, '/').replace(/^basis/, config.basisPath) + '.js';
          pushInFileList(fileName);
          fileDeps.push({
            type: 'basis.require',
            fileName: fileName
          });
        }
      }
    }

    function processWithParams(file, config){
      return function(){
        var args = Array.prototype.slice.call(arguments);
        process.apply(this, [file, config].concat(args));
      };
    }

    var code = file.content;
    var ast = jsp.parse(code);

    var astIdentity = function(){
      return walker.walk(ast);
    };

    walker.with_walkers({
      "call": processWithParams(file.fileName, config)
    }, astIdentity);

    return {
      fileDeps: fileDeps,
      fileList: fileList,
      config: config
    };
  }

  return {
    handle: handle
  };
}

module.exports = JSFileHandler;