var parser = require('uglify-js').parser;
var pro = require('uglify-js').uglify;
var util = require('util');
var l10nDictionariesCallModifier = require('../flowWorkers/l10nDictionariesCallModifier.js');

describe('l10nDictionariesCallModifier', function(){
  it('should replace identifier with number, replace path with empty string and replace keys with packed array', function(){
    var context = {
      __dirname: 'app/somepath/'
    };
    var dictInfo = {
      dictList: 
      {
        'app.dict': {
          path: 'app/somepath/l10n',
          keys: ['someKey', 'anotherKey']
        },
        'app.dict.subdict': {
          path: 'app/somepath/l10n',
          keys: ['a', 'b']
        }
      },
      l10nKeys: ['app.dict.someKey', 'app.dict.anotherKey', 'app.dict.subdict.a', 'app.dict.subdict.b']
    };
    var srcCode = "\
      basis.l10n.createDictionary('app.dict', __dirname + 'l10n', {\
        someKey: 'someValue',\
        anotherKey: 'anotherValue'\
      });\
      basis.l10n.createDictionary('app.dict.subdict', __dirname + 'l10n', {\
        a: 'someValue',\
        b: 'anotherValue'\
      });";
    var srcAst = parser.parse(srcCode);

    var resultAst = l10nDictionariesCallModifier(srcAst, context, dictInfo);

    expectedCode = "\
      basis.l10n.createDictionary('app.dict', '', [ '1', 'anotherValue', 'someValue']);\
      basis.l10n.createDictionary('app.dict.subdict', '', [ '4', 'someValue', 'anotherValue']);";
    var expectedAst = parser.parse(expectedCode);

    expect(resultAst).toEqual(expectedAst);
  });
});