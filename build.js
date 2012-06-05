var fs = require('fs');
var path = require('path');
var util = require('util');
var indexParser = require('./index.js');
var dependencyBuilder = require('./dep.js');


var indexPath = '/home/hsalkaline/workspace/dealerViewer/index.html';


var indexInfo = indexParser.parse(indexPath);
var rootPath = path.dirname(indexPath);

var indexInlineScript = indexInfo.scripts.filter(function(script){
  return script.type == 'inline';
}).map(function(script){
  return script.content;
}).join(';');

var indexScripts = indexInfo.scripts.filter(function(script){
  return script.type == 'external';
}).map(function(script){
  return script.src;
});

var depGraph = dependencyBuilder.getDependencyGraph({
  rootPath: rootPath,
  basisPath: indexInfo.basisPath,
  getFileContent: function(filepath){
    if (filepath == 'index')
    {
      return indexInlineScript;
    }
    return fs.readFileSync(path.resolve(rootPath, filepath), 'UTF-8');
  },
  initialFiles: ['index'].concat(indexScripts)
});

console.log(util.inspect(depGraph, false, null));


