var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;
var vm = require('vm');

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

function getAst(code){
  //return top level statement's ast
  return jsp.parse(code)[1][0][1];
}

function isAstEqualsCode(expr, code){
  return arraysEqual(expr, getAst(code));
}

function evalAstArgs(args, context){
  return args.map(function(arg){
    if (arg[0] == 'string')
    {
      return [arg[0], arg[1]];
    }
    else
    {
      var code = '(' + pro.gen_code(arg) + ')';
      try
      {
        var result = vm.runInNewContext(code, context);
        return [arg[0], result];
      }
      catch(e)
      {
        //console.log('unable to evaluate "', code, '" in context ', context);
        return [arg[0], ''];
      }
    }
  });
}

module.exports = {
  getAst: getAst,
  isAstEqualsCode: isAstEqualsCode,
  evalAstArgs: evalAstArgs
};