var pro = require("uglify-js").uglify;
var astUtils = require('../ast-utils.js');

function process(ast, context){
  var walker = pro.ast_walker();
  var dictList = {};
  var l10nKeys = [];

  walker.with_walkers({
    call: function(expr, args){
      if (astUtils.isAstEqualsCode(expr, 'basis.l10n.createDictionary'))
      {
        var eargs = astUtils.evalAstArgs(args, context);
        keys = Object.keys(eargs[2][1]);

        dictList[eargs[0][1]] = {
          path: eargs[1][1],
          keys: keys
        };

        keys.forEach(function(key){
          l10nKeys.push(eargs[0][1] + '.' + key);
        });  
      }
    }
  }, function(){
    return walker.walk(ast);
  });

  return {
    dictList: dictList,
    l10nKeys: l10nKeys
  };
}

module.exports = process;