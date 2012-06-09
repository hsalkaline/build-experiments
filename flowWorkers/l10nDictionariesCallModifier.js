var pro = require("uglify-js").uglify;
var astUtils = require('../ast-utils.js');
var util = require('util');


function createDictionaryKeyMap(keys){
  keys = keys.sort();

  var stack = [];
  var res = [];
  var map = [];
  var pathMap = {};
  var keyIndex = 0;
  for (var i = 0, key; key = keys[i]; i++)
  {
    var parts = key.split('.');
    var reset = false;
    var offset = 0;

    if (stack.length && stack[0] != parts[0])
    {
      res.push('#');
      stack = [];
    }
    
    if (!stack.length)
      reset = true;
    else
    {
      for (; offset < parts.length; offset++){
        if (parts[offset] != stack[offset])
        {
          if (stack[offset])
          {
            reset = true;
            res.push(new Array(stack.length - offset + 1).join('<'));
            stack.splice(offset);
          }
          break;
        }
      }
    }

    while (parts[offset])
    {
      if (!reset)
        res.push('>');

      reset = false;
      res.push(parts[offset]);
      stack.push(parts[offset]);
      offset++;
      
      var path = stack.join('.');
      map.push(path);
    }

  }

  return {
    map: map,
    content: res.join('')
  };
}

function packDictionary(dict, map){
  var linear = {};
  var result = [];

  for (var dictName in dict){
    for (var key in dict[dictName]){
      linear[dictName + '.' + key] = dict[dictName][key];
    }
  }

  for (var i = 0, gap = -1; i < map.length; i++)
  {
    if (linear[map[i]])
    {
      if (gap != -1)
        result.push(gap);

      result.push(linear[map[i]]);

      gap = -1;
    }
    else
      gap++;
  }

  if (typeof result[result.length - 1] == 'number')
    result.pop();

  return result;
}



function process(ast, context, dictInfo){
  var walker = pro.ast_walker();
  var dictionaryKeyMap = createDictionaryKeyMap(dictInfo.l10nKeys);

  return walker.with_walkers({
    call: function(expr, args){
      
      if (astUtils.isAstEqualsCode(expr, 'basis.l10n.createDictionary'))
      {
        var newArgs = astUtils.evalAstArgs(args, context);
        var id = newArgs[0][1];
        var tokens = newArgs[2][1];
        var dict = {};
        dict[id] = tokens;
        var newTokens = packDictionary(dict, dictionaryKeyMap.map);
        //newArgs[0] = identifier
        newArgs[1] = ['string', ''];
        newArgs[2] = ['array', newTokens.map(function(token){ return ['string', String(token)]; })];
        return [ this[0], walker.walk(expr), pro.MAP(newArgs, walker.walk) ];
      }
    }
  }, function(){
    return walker.walk(ast);
  });

}

module.exports = process;