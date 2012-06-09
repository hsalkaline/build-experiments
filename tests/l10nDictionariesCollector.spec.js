var parser = require('uglify-js').parser;
var l10nDictionariesCollector = require('../flowWorkers/l10nDictionariesCollector.js');

describe('l10nDictionariesCollector', function(){
  it('should extract dictionary id, extract and resolve path, collect dictionary keys from createDictionary calls', function(){
    var context = {
      __dirname: 'app/somepath/'
    };
    var code = "\
      basis.l10n.createDictionary('app.dict', __dirname + 'l10n', {\
        someKey: 'someValue',\
        anotherKey: 'anotherValue'\
      });\
      basis.l10n.createDictionary('app.dict.subdict', __dirname + 'l10n', {\
        a: 'someValue',\
        b: 'anotherValue'\
      });";
    var ast = parser.parse(code);

    var result = l10nDictionariesCollector(ast, context);

    var expectedResult = {
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

    expect(result).toEqual(expectedResult);
  });
});