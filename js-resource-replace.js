var path = require('path');
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;
var astUtils = require('./ast-utils.js');
var util = require('util');

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

function inspect(object){
  return util.inspect(object, false, null, true);
}

var dirname = 'basepath';

var replaceMap = {
  'some/resource/url.js': '1.js',
  'basepath/another/resource/url.js': '2.js'
};

var srcCode = "\
  var foo = basis.resource('some/resource/url.js')();\
  var bar = basis.resource('some/url/not/needed/to/be/replaced.css');\
  var baz = resource('another/resource/url.js');\
";

var expectedCode = "\
  var foo = basis.resource('1.js')();\
  var bar = basis.resource('some/url/not/needed/to/be/replaced.css');\
  var baz = resource('2.js');\
";

function JsResourceHandler(){

  var walker = pro.ast_walker();

  function handle(ast, replaceMap, context){

    return walker.with_walkers({
      call: function(expr, args){
        var eargs, newArgs;
        if (astUtils.isAstEqualsCode(expr, 'basis.resource'))
        {
          eargs = astUtils.evalAstArgs(args, context);
          newArgs = eargs.map(function(arg){
            var argValue = arg[1];
            return replaceMap[argValue] ? ['string', replaceMap[argValue]] : arg;
          });
          return [ this[0], walker.walk(expr), pro.MAP(newArgs, walker.walk) ];
        }
        if (astUtils.isAstEqualsCode(expr, 'resource'))
        {
          eargs = astUtils.evalAstArgs(args, context);
          newArgs = eargs.map(function(arg){
            var argValue = path.join(context.__dirname, arg[1]);
            return replaceMap[argValue] ? ['string', replaceMap[argValue]] : arg;
          });
          return [ this[0], walker.walk(expr), pro.MAP(newArgs, walker.walk) ];
        }
      }
    }, function(){
      return walker.walk(ast);
    });
  }

  return {
    handle: handle
  };
}

var jsResourceHandler = JsResourceHandler();

var srcCodeAst = jsp.parse(srcCode);
var expectedAst = jsp.parse(expectedCode);
var processedAst = jsResourceHandler.handle(srcCodeAst, replaceMap, {
  __dirname: dirname
});

console.log('Source code AST:');
console.log(inspect(srcCodeAst));
console.log('Processed AST:');
console.log(inspect(processedAst));
console.log('Expected code AST:');
console.log(inspect(expectedAst));
console.log('Processed AST are equals to expected code AST:', arraysEqual(processedAst, expectedAst));
console.log('Source code:');
console.log(srcCode);
console.log('Result code:');
console.log(pro.gen_code(processedAst));
